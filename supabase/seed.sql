-- =====================================================================
-- Eventia — DATOS DE PRUEBA (§28). No usar en producción.
-- Se cargan con `supabase db reset` (local) o `supabase db push --include-seed`.
-- Todo lo de prueba lleva "(prueba)" en el nombre o correos @eventia.test.
--
-- Cuentas (contraseña para todas: Eventia2026):
--   cliente@eventia.test               Cliente con un evento en borrador
--   proveedor.lugares@eventia.test     Dueño de los 5 lugares
--   proveedor.servicios@eventia.test   Dueño de los 5 servicios
-- =====================================================================

-- ---------- cuentas de Auth (el trigger crea las filas de usuarios) ----------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('Eventia2026', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}',
  jsonb_build_object('full_name', u.full_name, 'phone', u.phone, 'role', u.role),
  now(), now(), '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'cliente@eventia.test', 'Caleb Pérez (prueba)', '3001234567', 'client'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'proveedor.lugares@eventia.test', 'Marta Ipuana (prueba)', '3007654321', 'provider'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'proveedor.servicios@eventia.test', 'Jorge Epieyú (prueba)', '3011112233', 'provider')
) as u (id, email, full_name, phone, role)
on conflict (id) do nothing;

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.email like '%@eventia.test'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- ---------- perfiles de proveedor ----------
insert into public.perfiles_proveedor (id, user_id, business_name, description, phone, email, address, city, verified)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'Lugares Caribe (prueba)', 'Salones y terrazas para eventos en Riohacha.', '3007654321',
   'proveedor.lugares@eventia.test', 'Calle 1 # 5-20', 'Riohacha', true),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003',
   'Servicios Guajira (prueba)', 'Comida, decoración, música y fotografía para eventos.', '3011112233',
   'proveedor.servicios@eventia.test', 'Carrera 7 # 12-40', 'Riohacha', true)
on conflict (id) do nothing;

-- ---------- lugares (§28) ----------
insert into public.lugares (id, provider_id, category_id, name, description, capacity, price, city, address, latitude, longitude)
select v.id, 'b0000000-0000-4000-8000-000000000001', c.id, v.name, v.description, v.capacity, v.price,
       'Riohacha', v.address, v.lat, v.lng
from (values
  ('c0000000-0000-4000-8000-000000000001'::uuid, 'Salón', 'Salón Caribe (prueba)',
   'Salón climatizado a dos cuadras del malecón, con pista de baile, tarima y parqueadero para 30 carros.',
   150, 2000000, 'Calle 2 # 8-15', 11.544100, -72.907200),
  ('c0000000-0000-4000-8000-000000000002'::uuid, 'Centro de convenciones', 'Centro de Eventos Guajira (prueba)',
   'Auditorio y dos salas modulares para conferencias y graduaciones.', 400, 4500000, 'Avenida La Marina # 15-30', 11.545800, -72.912500),
  ('c0000000-0000-4000-8000-000000000003'::uuid, 'Casa de eventos', 'Casa Eventos del Norte (prueba)',
   'Casa con jardín y kiosco para eventos familiares.', 80, 1200000, 'Calle 40 # 12-05', 11.530200, -72.901100),
  ('c0000000-0000-4000-8000-000000000004'::uuid, 'Espacio abierto', 'Terraza La Perla (prueba)',
   'Terraza frente al mar con iluminación cálida, ideal para cumpleaños y aniversarios.', 120, 1600000, 'Malecón, Calle 1 # 3-10', 11.547300, -72.909800),
  ('c0000000-0000-4000-8000-000000000005'::uuid, 'Salón', 'Salón Riohacha (prueba)',
   'Salón básico con mesas, sillas y sonido incluido.', 100, 900000, 'Carrera 10 # 20-18', 11.539000, -72.905400)
) as v (id, category, name, description, capacity, price, address, lat, lng)
join public.categorias c on c.type = 'venue' and c.name = v.category
on conflict (id) do nothing;

insert into public.disponibilidad (venue_id, date, start_time, end_time, status) values
  ('c0000000-0000-4000-8000-000000000001', '2026-12-17', '00:00', '23:59', 'BLOCKED'),
  ('c0000000-0000-4000-8000-000000000001', '2026-12-19', '00:00', '23:59', 'BLOCKED');

-- ---------- servicios (§28) ----------
insert into public.servicios (id, provider_id, category_id, name, description, price, unit)
select v.id, 'b0000000-0000-4000-8000-000000000002', c.id, v.name, v.description, v.price, v.unit::public.service_unit
from (values
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'Alimentación', 'Buffet Caribeño (prueba)',
   'Buffet con arroz con coco, pescado y bebidas.', 20000, 'per_person'),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'Decoración', 'Decoraciones Dreams (prueba)',
   'Decoración temática para grados, bodas y cumpleaños.', 800000, 'per_event'),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'Música', 'DJ La Guajira (prueba)',
   'DJ con sonido e iluminación básica.', 125000, 'per_hour'),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'Música', 'Vallenato Eventos (prueba)',
   'Conjunto vallenato, 4 horas.', 1500000, 'per_event'),
  ('d0000000-0000-4000-8000-000000000005'::uuid, 'Fotografía', 'FotoEventos (prueba)',
   'Cobertura fotográfica y entrega digital.', 700000, 'per_event')
) as v (id, category, name, description, price, unit)
join public.categorias c on c.type = 'service' and c.name = v.category
on conflict (id) do nothing;

-- ---------- evento de ejemplo del cliente (§14) ----------
insert into public.eventos (id, user_id, event_type_id, name, date, start_time, end_time, guests, budget, city, description)
select 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', c.id,
       'Graduación Ingeniería de Sistemas (prueba)', '2026-12-15', '18:00', '00:00', 120, 8000000, 'Riohacha',
       'Celebración de grado con familiares.'
from public.categorias c where c.type = 'event' and c.name = 'Graduación'
on conflict (id) do nothing;

insert into public.servicios_evento (event_id, service_id) values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000004')
on conflict (event_id, service_id) do nothing;
