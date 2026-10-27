-- =====================================================================
-- Eventia — 1. Esquema: tipos, tablas, restricciones, índices y vista.
-- Diseño y justificación: docs/DIAGRAMA_BD.md
-- Tablas en español; columnas según EVENTIA_PROYECTO.md §25.
-- =====================================================================

-- La restricción de exclusión (venue_id WITH =) necesita btree_gist.
create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.user_role as enum ('client', 'provider', 'admin');
create type public.listing_status as enum ('ACTIVE', 'INACTIVE', 'UNDER_REVIEW');
create type public.category_type as enum ('venue', 'service', 'event');
create type public.service_unit as enum ('per_event', 'per_person', 'per_hour');
create type public.availability_status as enum ('AVAILABLE', 'BLOCKED');
create type public.event_status as enum ('DRAFT', 'PLANNED', 'BOOKED', 'COMPLETED', 'CANCELLED');
create type public.reservation_status as enum ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED');
create type public.message_role as enum ('user', 'assistant', 'system');

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Fecha + hora local de Colombia → rango. Si la hora final es menor o igual
-- a la inicial, el evento termina al día siguiente (fiesta de 6 p. m. a 2 a. m.).
create function public.event_period(p_date date, p_start time, p_end time)
returns tstzrange
language sql
stable
set search_path = ''
as $$
  select tstzrange(
    (p_date + p_start) at time zone 'America/Bogota',
    (p_date + p_end + case when p_end <= p_start then interval '1 day' else interval '0' end)
      at time zone 'America/Bogota',
    '[)'
  );
$$;

-- ---------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------
create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.user_role not null default 'client',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.usuarios is 'Datos de la persona. Uno a uno con auth.users (mismo id). El correo y la contraseña viven en auth.users.';

create table public.perfiles_proveedor (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.usuarios (id) on delete cascade,
  business_name text not null check (length(trim(business_name)) > 0),
  description text,
  phone text,
  email text,
  address text,
  city text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.perfiles_proveedor.phone is 'Contacto del negocio, distinto del teléfono personal en usuarios.';

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type public.category_type not null,
  created_at timestamptz not null default now(),
  unique (type, name)
);

create table public.lugares (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.perfiles_proveedor (id) on delete cascade,
  category_id uuid not null references public.categorias (id),
  name text not null check (length(trim(name)) > 0),
  description text,
  capacity integer not null check (capacity > 0),
  price numeric(12, 0) not null check (price >= 0),
  city text not null,
  address text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  status public.listing_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.imagenes_lugar (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.lugares (id) on delete cascade,
  image_url text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

-- Solo lo que define el proveedor. Lo ocupado sale de reservas.
create table public.disponibilidad (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.lugares (id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  status public.availability_status not null default 'AVAILABLE',
  created_at timestamptz not null default now(),
  check (end_time <> start_time)
);

create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.perfiles_proveedor (id) on delete cascade,
  category_id uuid not null references public.categorias (id),
  name text not null check (length(trim(name)) > 0),
  description text,
  price numeric(12, 0) not null check (price >= 0),
  unit public.service_unit not null default 'per_event',
  status public.listing_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Planificación y reservas
-- ---------------------------------------------------------------------
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios (id) on delete cascade,
  event_type_id uuid not null references public.categorias (id),
  name text not null check (length(trim(name)) > 0),
  date date,
  start_time time,
  end_time time,
  guests integer not null check (guests > 0),
  budget numeric(12, 0) check (budget >= 0),
  city text,
  description text,
  special_needs text,
  status public.event_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time is null or end_time is null or end_time <> start_time)
);
comment on column public.eventos.city is 'Ciudad que busca el cliente; la del lugar está en lugares.city.';

create table public.servicios_evento (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.eventos (id) on delete cascade,
  service_id uuid not null references public.servicios (id),
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 0) not null default 0 check (unit_price >= 0),
  subtotal numeric(14, 0) generated always as (quantity * unit_price) stored,
  status public.reservation_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  unique (event_id, service_id)
);
comment on column public.servicios_evento.unit_price is 'Precio congelado al agregar el servicio (§27.8). Lo fija un trigger.';

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.eventos (id) on delete cascade,
  venue_id uuid not null references public.lugares (id),
  period tstzrange not null,
  venue_price numeric(12, 0) not null check (venue_price >= 0),
  discount numeric(12, 0) not null default 0 check (discount >= 0),
  extra_costs numeric(12, 0) not null default 0 check (extra_costs >= 0),
  status public.reservation_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- §13: nunca dos reservas confirmadas del mismo lugar con horarios cruzados.
  constraint reservas_sin_cruce exclude using gist (venue_id with =, period with &&)
    where (status = 'CONFIRMED')
);
comment on column public.reservas.period is 'Copia de la fecha y hora de eventos (la mantiene un trigger). Es la única copia intencional: la restricción de exclusión necesita el rango en esta tabla.';
comment on column public.reservas.venue_price is 'Precio del lugar congelado al reservar (§27.8).';

-- Un evento tiene como máximo una reserva activa.
create unique index reservas_una_activa_por_evento
  on public.reservas (event_id)
  where status in ('PENDING', 'CONFIRMED');

create table public.valoraciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios (id) on delete cascade,
  venue_id uuid references public.lugares (id) on delete cascade,
  service_id uuid references public.servicios (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  check (venue_id is not null or service_id is not null)
);

-- ---------------------------------------------------------------------
-- Asistente IA
-- ---------------------------------------------------------------------
create table public.conversaciones_ia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios (id) on delete cascade,
  event_id uuid references public.eventos (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mensajes_ia (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversaciones_ia (id) on delete cascade,
  role public.message_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices (llaves foráneas y búsquedas frecuentes)
-- ---------------------------------------------------------------------
create index on public.lugares (provider_id);
create index on public.lugares (category_id);
create index on public.lugares (city, status);
create index on public.imagenes_lugar (venue_id, position);
create index on public.disponibilidad (venue_id, date);
create index on public.servicios (provider_id);
create index on public.servicios (category_id, status);
create index on public.eventos (user_id);
create index on public.eventos (event_type_id);
create index on public.servicios_evento (service_id);
create index on public.reservas (venue_id);
create index on public.valoraciones (venue_id);
create index on public.valoraciones (service_id);
create index on public.valoraciones (user_id);
create index on public.conversaciones_ia (user_id);
create index on public.conversaciones_ia (event_id);
create index on public.mensajes_ia (conversation_id, created_at);

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create trigger set_updated_at before update on public.usuarios for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.perfiles_proveedor for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.lugares for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.servicios for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.eventos for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.reservas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.conversaciones_ia for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- La categoría debe ser del tipo correcto (lugar, servicio o evento)
-- ---------------------------------------------------------------------
create function public.check_category_type()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := (to_jsonb(new) ->> tg_argv[0])::uuid;
  v_type public.category_type;
begin
  select c.type into v_type from public.categorias c where c.id = v_id;
  if v_type is distinct from tg_argv[1]::public.category_type then
    raise exception 'La categoría elegida no corresponde a este tipo de registro.'
      using errcode = 'EV400', hint = format('Se esperaba una categoría de tipo %s.', tg_argv[1]);
  end if;
  return new;
end;
$$;

create trigger check_category before insert or update of category_id on public.lugares
  for each row execute function public.check_category_type('category_id', 'venue');
create trigger check_category before insert or update of category_id on public.servicios
  for each row execute function public.check_category_type('category_id', 'service');
create trigger check_category before insert or update of event_type_id on public.eventos
  for each row execute function public.check_category_type('event_type_id', 'event');

-- ---------------------------------------------------------------------
-- Vista de totales (no se guardan totales en tablas)
-- ---------------------------------------------------------------------
create view public.totales_evento
with (security_invoker = true)
as
select
  e.id as event_id,
  e.budget,
  r.id as reservation_id,
  coalesce(r.venue_price, 0) as venue_price,
  coalesce(s.services_total, 0) as services_total,
  coalesce(r.discount, 0) as discount,
  coalesce(r.extra_costs, 0) as extra_costs,
  coalesce(r.venue_price, 0) + coalesce(s.services_total, 0)
    - coalesce(r.discount, 0) + coalesce(r.extra_costs, 0) as total,
  e.budget - (coalesce(r.venue_price, 0) + coalesce(s.services_total, 0)
    - coalesce(r.discount, 0) + coalesce(r.extra_costs, 0)) as remaining
from public.eventos e
left join public.reservas r
  on r.event_id = e.id and r.status in ('PENDING', 'CONFIRMED', 'COMPLETED')
left join lateral (
  select sum(se.subtotal) as services_total
  from public.servicios_evento se
  where se.event_id = e.id and se.status in ('PENDING', 'CONFIRMED', 'COMPLETED')
) s on true;

comment on view public.totales_evento is 'Total = lugar + servicios − descuento + costos adicionales. remaining = presupuesto − total.';
