-- =====================================================================
-- Eventia — 2. Reglas de negocio (§27) y seguridad (RLS, §26).
--
-- Los estados de reservas y servicios contratados solo cambian a través
-- de funciones (RPC). Así la app no puede saltarse una regla escribiendo
-- directo en la tabla.
--
-- Errores propios (SQLSTATE), el mensaje ya viene en español para la app:
--   EV400 dato no válido        EV401 inicia sesión
--   EV403 sin permiso           EV404 no existe o no es tuyo
--   EV409 conflicto de estado u horario
-- =====================================================================

-- ---------------------------------------------------------------------
-- Funciones de apoyo para las políticas.
-- SECURITY DEFINER evita la recursión entre políticas de tablas que se
-- referencian entre sí (eventos ↔ reservas ↔ servicios_evento).
-- ---------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = (select auth.uid()) and u.role = 'admin'
  );
$$;

create function public.mi_proveedor_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.id from public.perfiles_proveedor p where p.user_id = (select auth.uid());
$$;

create function public.es_dueno_evento(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.eventos e
    where e.id = p_event_id and e.user_id = (select auth.uid())
  );
$$;

create function public.es_dueno_lugar(p_venue_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.lugares l
    join public.perfiles_proveedor p on p.id = l.provider_id
    where l.id = p_venue_id and p.user_id = (select auth.uid())
  );
$$;

create function public.es_dueno_servicio(p_service_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.servicios s
    join public.perfiles_proveedor p on p.id = s.provider_id
    where s.id = p_service_id and p.user_id = (select auth.uid())
  );
$$;

-- El proveedor ve los eventos donde reservaron su lugar o contrataron su servicio.
create function public.es_proveedor_del_evento(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.reservas r
    join public.lugares l on l.id = r.venue_id
    join public.perfiles_proveedor p on p.id = l.provider_id
    where r.event_id = p_event_id and p.user_id = (select auth.uid())
  ) or exists (
    select 1 from public.servicios_evento se
    join public.servicios s on s.id = se.service_id
    join public.perfiles_proveedor p on p.id = s.provider_id
    where se.event_id = p_event_id and p.user_id = (select auth.uid())
  );
$$;

-- El proveedor ve nombre y teléfono de sus clientes, nada más.
create function public.es_mi_cliente(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.eventos e
    where e.user_id = p_user_id and public.es_proveedor_del_evento(e.id)
  );
$$;

-- Marca de "lo hace el sistema" para los triggers de protección. Solo la
-- activan las funciones de este archivo, dentro de su propia transacción.
create function public.es_sistema()
returns boolean
language sql stable set search_path = ''
as $$
  select (select auth.uid()) is null
      or coalesce(current_setting('eventia.sistema', true), '') = 'on';
$$;

-- ---------------------------------------------------------------------
-- Alta de usuario: Supabase Auth crea auth.users y aquí nace usuarios.
-- El rol 'admin' nunca llega desde el registro.
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.usuarios (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    case when new.raw_user_meta_data ->> 'role' = 'provider'
      then 'provider'::public.user_role
      else 'client'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un cliente puede volverse proveedor; nadie se da el rol admin a sí mismo.
create function public.guard_usuario()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if public.es_sistema() or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     and not (old.role = 'client' and new.role = 'provider') then
    raise exception 'No puedes cambiar tu rol a %.', new.role using errcode = 'EV403';
  end if;
  return new;
end;
$$;

create trigger guard_usuario before update on public.usuarios
  for each row execute function public.guard_usuario();

-- Solo un admin marca a un proveedor como verificado.
create function public.guard_perfil_proveedor()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not (public.es_sistema() or public.is_admin()) then
    new.verified := case when tg_op = 'INSERT' then false else old.verified end;
  end if;
  return new;
end;
$$;

create trigger guard_perfil_proveedor before insert or update on public.perfiles_proveedor
  for each row execute function public.guard_perfil_proveedor();

-- ---------------------------------------------------------------------
-- Estado del evento: lo calcula el sistema según reserva y servicios.
--   sin reserva activa          → DRAFT
--   reserva pendiente           → PLANNED
--   reserva confirmada y ningún
--   servicio pendiente          → BOOKED
-- ---------------------------------------------------------------------
create function public.actualizar_estado_evento(p_event_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_current public.event_status;
  v_next public.event_status;
begin
  select e.status into v_current from public.eventos e where e.id = p_event_id;
  if v_current is null or v_current in ('COMPLETED', 'CANCELLED') then
    return;
  end if;

  if exists (select 1 from public.reservas r where r.event_id = p_event_id and r.status = 'CONFIRMED') then
    v_next := case
      when exists (select 1 from public.servicios_evento se where se.event_id = p_event_id and se.status = 'PENDING')
        then 'PLANNED'
      else 'BOOKED'
    end;
  elsif exists (select 1 from public.reservas r where r.event_id = p_event_id and r.status = 'PENDING') then
    v_next := 'PLANNED';
  else
    v_next := 'DRAFT';
  end if;

  if v_next is distinct from v_current then
    perform set_config('eventia.sistema', 'on', true);
    update public.eventos set status = v_next where id = p_event_id;
    perform set_config('eventia.sistema', 'off', true);
  end if;
end;
$$;

-- El cliente edita su evento, pero no su estado; y no puede mover la fecha
-- de un evento con reserva confirmada. Con reserva pendiente, el periodo
-- de la reserva se actualiza solo.
create function public.guard_evento()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if public.es_sistema() then
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'El estado del evento lo actualiza Eventia según la reserva.' using errcode = 'EV403';
  end if;

  if (new.date, new.start_time, new.end_time) is distinct from (old.date, old.start_time, old.end_time) then
    if exists (select 1 from public.reservas r where r.event_id = new.id and r.status = 'CONFIRMED') then
      raise exception 'Cancela la reserva confirmada antes de cambiar la fecha o la hora.' using errcode = 'EV409';
    end if;
    if exists (select 1 from public.reservas r where r.event_id = new.id and r.status = 'PENDING') then
      if new.date is null or new.start_time is null or new.end_time is null then
        raise exception 'El evento tiene una reserva pendiente: necesita fecha y hora.' using errcode = 'EV400';
      end if;
      update public.reservas
        set period = public.event_period(new.date, new.start_time, new.end_time)
        where event_id = new.id and status = 'PENDING';
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_evento before update on public.eventos
  for each row execute function public.guard_evento();

-- ---------------------------------------------------------------------
-- Servicios contratados: precio congelado y cantidad según la unidad.
-- ---------------------------------------------------------------------
create function public.preparar_servicio_evento()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_service public.servicios;
  v_event public.eventos;
begin
  select * into v_service from public.servicios s where s.id = new.service_id;
  if not found or v_service.status <> 'ACTIVE' then
    raise exception 'Este servicio ya no está disponible.' using errcode = 'EV409';
  end if;

  select * into v_event from public.eventos e where e.id = new.event_id;
  if v_event.status in ('COMPLETED', 'CANCELLED') then
    raise exception 'Este evento ya no admite cambios.' using errcode = 'EV409';
  end if;

  new.unit_price := v_service.price;          -- §27.8
  if not public.es_sistema() then
    new.status := 'PENDING';
  end if;
  new.quantity := case v_service.unit
    when 'per_person' then v_event.guests
    when 'per_event' then 1
    else new.quantity                          -- per_hour: horas que indica la app
  end;
  return new;
end;
$$;

create trigger preparar_servicio_evento before insert on public.servicios_evento
  for each row execute function public.preparar_servicio_evento();

create function public.servicio_evento_cambio()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.actualizar_estado_evento(coalesce(new.event_id, old.event_id));
  return null;
end;
$$;

create trigger servicio_evento_cambio after insert or delete on public.servicios_evento
  for each row execute function public.servicio_evento_cambio();

-- ---------------------------------------------------------------------
-- RPC: reservar, responder y cancelar (§17, §27)
-- ---------------------------------------------------------------------
create function public.crear_reserva(p_event_id uuid, p_venue_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_event public.eventos;
  v_venue public.lugares;
  v_period tstzrange;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Inicia sesión para reservar.' using errcode = 'EV401';
  end if;

  select * into v_event from public.eventos e
    where e.id = p_event_id and e.user_id = v_uid
    for update;
  if not found then
    raise exception 'No encontramos ese evento en tu cuenta.' using errcode = 'EV404';
  end if;
  if v_event.status in ('BOOKED', 'COMPLETED', 'CANCELLED') then
    raise exception 'Este evento ya no admite reservas nuevas.' using errcode = 'EV409';
  end if;
  if v_event.date is null or v_event.start_time is null or v_event.end_time is null then
    raise exception 'Agrega la fecha y la hora del evento antes de reservar.' using errcode = 'EV400';
  end if;

  select * into v_venue from public.lugares l where l.id = p_venue_id;
  if not found or v_venue.status <> 'ACTIVE' then
    raise exception 'Este lugar no está disponible para reservas.' using errcode = 'EV409';
  end if;
  if v_event.guests > v_venue.capacity then
    raise exception 'El lugar recibe hasta % invitados y tu evento tiene %.', v_venue.capacity, v_event.guests
      using errcode = 'EV409';
  end if;

  v_period := public.event_period(v_event.date, v_event.start_time, v_event.end_time);
  if lower(v_period) <= now() then
    raise exception 'La fecha del evento ya pasó. Elige una fecha futura.' using errcode = 'EV400';
  end if;

  if exists (
    select 1 from public.disponibilidad d
    where d.venue_id = p_venue_id and d.status = 'BLOCKED'
      and public.event_period(d.date, d.start_time, d.end_time) && v_period
  ) then
    raise exception 'El lugar no abre en ese horario. Elige otra fecha u hora.' using errcode = 'EV409';
  end if;

  if exists (
    select 1 from public.reservas r
    where r.venue_id = p_venue_id and r.status = 'CONFIRMED' and r.period && v_period
  ) then
    raise exception 'Ese horario ya está reservado. Elige otra fecha u hora.' using errcode = 'EV409';
  end if;

  begin
    insert into public.reservas (event_id, venue_id, period, venue_price)
    values (p_event_id, p_venue_id, v_period, v_venue.price)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'Este evento ya tiene una reserva activa. Cancélala para reservar otro lugar.'
      using errcode = 'EV409';
  end;

  perform public.actualizar_estado_evento(p_event_id);
  return v_id;
end;
$$;

create function public.responder_reserva(p_reserva_id uuid, p_aceptar boolean)
returns public.reservation_status
language plpgsql security definer set search_path = ''
as $$
declare
  v_res public.reservas;
  v_next public.reservation_status := case when p_aceptar then 'CONFIRMED' else 'REJECTED' end;
begin
  select * into v_res from public.reservas r where r.id = p_reserva_id for update;
  if not found or not public.es_dueno_lugar(v_res.venue_id) then
    raise exception 'No encontramos esa solicitud entre las de tus lugares.' using errcode = 'EV404';
  end if;
  if v_res.status <> 'PENDING' then
    raise exception 'Esta solicitud ya fue respondida.' using errcode = 'EV409';
  end if;

  begin
    update public.reservas set status = v_next where id = p_reserva_id;
  exception when exclusion_violation then
    raise exception 'Ya confirmaste otra reserva en ese horario.' using errcode = 'EV409';
  end;

  perform public.actualizar_estado_evento(v_res.event_id);
  return v_next;
end;
$$;

create function public.cancelar_reserva(p_reserva_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_res public.reservas;
begin
  select * into v_res from public.reservas r where r.id = p_reserva_id for update;
  if not found or not (public.es_dueno_evento(v_res.event_id) or public.es_dueno_lugar(v_res.venue_id)) then
    raise exception 'No encontramos esa reserva en tu cuenta.' using errcode = 'EV404';
  end if;
  if v_res.status not in ('PENDING', 'CONFIRMED') then
    raise exception 'Esta reserva ya no se puede cancelar.' using errcode = 'EV409';
  end if;
  if lower(v_res.period) <= now() then
    raise exception 'El evento ya empezó; no se puede cancelar desde la app.' using errcode = 'EV409';
  end if;

  update public.reservas set status = 'CANCELLED' where id = p_reserva_id;
  perform public.actualizar_estado_evento(v_res.event_id);
end;
$$;

create function public.responder_servicio(p_servicio_evento_id uuid, p_aceptar boolean)
returns public.reservation_status
language plpgsql security definer set search_path = ''
as $$
declare
  v_row public.servicios_evento;
  v_next public.reservation_status := case when p_aceptar then 'CONFIRMED' else 'REJECTED' end;
begin
  select * into v_row from public.servicios_evento se where se.id = p_servicio_evento_id for update;
  if not found or not public.es_dueno_servicio(v_row.service_id) then
    raise exception 'No encontramos esa solicitud entre las de tus servicios.' using errcode = 'EV404';
  end if;
  if v_row.status <> 'PENDING' then
    raise exception 'Esta solicitud ya fue respondida.' using errcode = 'EV409';
  end if;

  update public.servicios_evento set status = v_next where id = p_servicio_evento_id;
  perform public.actualizar_estado_evento(v_row.event_id);
  return v_next;
end;
$$;

-- Calendario de un lugar sin exponer datos de otros clientes (§13).
-- status: AVAILABLE / BLOCKED (definidos por el proveedor), PENDING / RESERVED (reservas).
create function public.ocupacion_lugar(p_venue_id uuid, p_desde date, p_hasta date)
returns table (starts_at timestamptz, ends_at timestamptz, status text)
language sql stable security definer set search_path = ''
as $$
  select lower(public.event_period(d.date, d.start_time, d.end_time)),
         upper(public.event_period(d.date, d.start_time, d.end_time)),
         d.status::text
  from public.disponibilidad d
  where d.venue_id = p_venue_id and d.date between p_desde and p_hasta
  union all
  select lower(r.period), upper(r.period),
         case r.status when 'CONFIRMED' then 'RESERVED' else 'PENDING' end
  from public.reservas r
  where r.venue_id = p_venue_id
    and r.status in ('PENDING', 'CONFIRMED')
    and r.period && tstzrange(p_desde::timestamp at time zone 'America/Bogota',
                              (p_hasta + 1)::timestamp at time zone 'America/Bogota')
  order by 1;
$$;

-- Cierre diario: reservas y eventos que ya pasaron quedan COMPLETED.
-- Programar con pg_cron (ver supabase/README.md).
create function public.completar_eventos_pasados()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_events uuid[];
begin
  perform set_config('eventia.sistema', 'on', true);

  with done as (
    update public.reservas set status = 'COMPLETED'
    where status = 'CONFIRMED' and upper(period) < now()
    returning event_id
  )
  select coalesce(array_agg(event_id), '{}') into v_events from done;

  update public.eventos set status = 'COMPLETED'
  where id = any (v_events) and status in ('PLANNED', 'BOOKED');

  update public.servicios_evento set status = 'COMPLETED'
  where event_id = any (v_events) and status = 'CONFIRMED';

  perform set_config('eventia.sistema', 'off', true);
  return cardinality(v_events);
end;
$$;

-- ---------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------
revoke execute on function
  public.actualizar_estado_evento(uuid),
  public.completar_eventos_pasados(),
  public.handle_new_user(),
  public.guard_usuario(),
  public.guard_perfil_proveedor(),
  public.guard_evento(),
  public.preparar_servicio_evento(),
  public.servicio_evento_cambio(),
  public.check_category_type()
from public, anon, authenticated;

revoke execute on function
  public.crear_reserva(uuid, uuid),
  public.responder_reserva(uuid, boolean),
  public.cancelar_reserva(uuid),
  public.responder_servicio(uuid, boolean),
  public.ocupacion_lugar(uuid, date, date)
from public, anon;

grant execute on function
  public.crear_reserva(uuid, uuid),
  public.responder_reserva(uuid, boolean),
  public.cancelar_reserva(uuid),
  public.responder_servicio(uuid, boolean),
  public.ocupacion_lugar(uuid, date, date)
to authenticated;

-- Tablas: los permisos finos los da RLS.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.categorias to anon;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.usuarios enable row level security;
alter table public.perfiles_proveedor enable row level security;
alter table public.categorias enable row level security;
alter table public.lugares enable row level security;
alter table public.imagenes_lugar enable row level security;
alter table public.disponibilidad enable row level security;
alter table public.servicios enable row level security;
alter table public.eventos enable row level security;
alter table public.servicios_evento enable row level security;
alter table public.reservas enable row level security;
alter table public.valoraciones enable row level security;
alter table public.conversaciones_ia enable row level security;
alter table public.mensajes_ia enable row level security;

-- usuarios
create policy "usuarios: ver el propio, clientes propios o admin" on public.usuarios
  for select to authenticated
  using (id = (select auth.uid()) or public.es_mi_cliente(id) or public.is_admin());
create policy "usuarios: editar el propio" on public.usuarios
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- perfiles_proveedor
create policy "perfiles_proveedor: lectura" on public.perfiles_proveedor
  for select to authenticated using (true);
create policy "perfiles_proveedor: crear el propio" on public.perfiles_proveedor
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.usuarios u where u.id = (select auth.uid()) and u.role in ('provider', 'admin'))
  );
create policy "perfiles_proveedor: editar el propio" on public.perfiles_proveedor
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());
create policy "perfiles_proveedor: borrar (admin)" on public.perfiles_proveedor
  for delete to authenticated using (public.is_admin());

-- categorias
create policy "categorias: lectura" on public.categorias
  for select to anon, authenticated using (true);
create policy "categorias: administrar (admin)" on public.categorias
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- lugares
create policy "lugares: activos, propios o admin" on public.lugares
  for select to authenticated
  using (status = 'ACTIVE' or provider_id = (select public.mi_proveedor_id()) or public.is_admin());
create policy "lugares: crear propios" on public.lugares
  for insert to authenticated with check (provider_id = (select public.mi_proveedor_id()));
create policy "lugares: editar propios" on public.lugares
  for update to authenticated
  using (provider_id = (select public.mi_proveedor_id()) or public.is_admin())
  with check (provider_id = (select public.mi_proveedor_id()) or public.is_admin());
create policy "lugares: borrar propios" on public.lugares
  for delete to authenticated
  using (provider_id = (select public.mi_proveedor_id()) or public.is_admin());

-- imagenes_lugar
create policy "imagenes_lugar: de lugares visibles" on public.imagenes_lugar
  for select to authenticated
  using (exists (select 1 from public.lugares l where l.id = venue_id));
create policy "imagenes_lugar: el dueño del lugar" on public.imagenes_lugar
  for all to authenticated
  using (public.es_dueno_lugar(venue_id)) with check (public.es_dueno_lugar(venue_id));

-- disponibilidad
create policy "disponibilidad: de lugares visibles" on public.disponibilidad
  for select to authenticated
  using (exists (select 1 from public.lugares l where l.id = venue_id));
create policy "disponibilidad: el dueño del lugar" on public.disponibilidad
  for all to authenticated
  using (public.es_dueno_lugar(venue_id)) with check (public.es_dueno_lugar(venue_id));

-- servicios
create policy "servicios: activos, propios o admin" on public.servicios
  for select to authenticated
  using (status = 'ACTIVE' or provider_id = (select public.mi_proveedor_id()) or public.is_admin());
create policy "servicios: crear propios" on public.servicios
  for insert to authenticated with check (provider_id = (select public.mi_proveedor_id()));
create policy "servicios: editar propios" on public.servicios
  for update to authenticated
  using (provider_id = (select public.mi_proveedor_id()) or public.is_admin())
  with check (provider_id = (select public.mi_proveedor_id()) or public.is_admin());
create policy "servicios: borrar propios" on public.servicios
  for delete to authenticated
  using (provider_id = (select public.mi_proveedor_id()) or public.is_admin());

-- eventos
create policy "eventos: propios, de mis clientes o admin" on public.eventos
  for select to authenticated
  using (user_id = (select auth.uid()) or public.es_proveedor_del_evento(id) or public.is_admin());
create policy "eventos: crear propios" on public.eventos
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'DRAFT');
create policy "eventos: editar propios" on public.eventos
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "eventos: borrar borradores propios" on public.eventos
  for delete to authenticated
  using (user_id = (select auth.uid()) and status in ('DRAFT', 'CANCELLED'));

-- servicios_evento (sin UPDATE: el estado cambia con responder_servicio)
create policy "servicios_evento: del evento o del proveedor" on public.servicios_evento
  for select to authenticated
  using (public.es_dueno_evento(event_id) or public.es_dueno_servicio(service_id) or public.is_admin());
create policy "servicios_evento: agregar a mi evento" on public.servicios_evento
  for insert to authenticated with check (public.es_dueno_evento(event_id));
create policy "servicios_evento: quitar de mi evento" on public.servicios_evento
  for delete to authenticated
  using (public.es_dueno_evento(event_id) and status in ('PENDING', 'REJECTED', 'CANCELLED'));

-- reservas (solo lectura: se crean y cambian con las funciones RPC)
create policy "reservas: del cliente, del lugar o admin" on public.reservas
  for select to authenticated
  using (public.es_dueno_evento(event_id) or public.es_dueno_lugar(venue_id) or public.is_admin());

-- valoraciones: solo después de un evento finalizado (§33)
create policy "valoraciones: lectura" on public.valoraciones
  for select to authenticated using (true);
create policy "valoraciones: después del evento" on public.valoraciones
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (venue_id is null or exists (
      select 1 from public.reservas r
      join public.eventos e on e.id = r.event_id
      where r.venue_id = valoraciones.venue_id and r.status = 'COMPLETED' and e.user_id = (select auth.uid())
    ))
    and (service_id is null or exists (
      select 1 from public.servicios_evento se
      join public.eventos e on e.id = se.event_id
      where se.service_id = valoraciones.service_id and se.status = 'COMPLETED' and e.user_id = (select auth.uid())
    ))
  );
create policy "valoraciones: editar las propias" on public.valoraciones
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "valoraciones: borrar las propias" on public.valoraciones
  for delete to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- conversaciones_ia
create policy "conversaciones_ia: propias" on public.conversaciones_ia
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (event_id is null or public.es_dueno_evento(event_id)));

-- mensajes_ia: la app escribe solo mensajes del usuario; los de la IA
-- los escribe la Edge Function con la service role.
create policy "mensajes_ia: de mis conversaciones" on public.mensajes_ia
  for select to authenticated
  using (exists (select 1 from public.conversaciones_ia c where c.id = conversation_id and c.user_id = (select auth.uid())));
create policy "mensajes_ia: escribir como usuario" on public.mensajes_ia
  for insert to authenticated
  with check (
    role = 'user'
    and exists (select 1 from public.conversaciones_ia c where c.id = conversation_id and c.user_id = (select auth.uid()))
  );
