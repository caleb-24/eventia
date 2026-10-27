import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Prueba las migraciones y el seed en un Postgres 17 embebido (PGlite), sin Docker
// ni proyecto remoto. Simula lo mínimo de Supabase: roles, auth.uid() y storage.
// Ejecutar: npm run test:db
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const db = new PGlite({ extensions: { btree_gist, pgcrypto } });

// --- Lo mínimo de Supabase: roles, auth, storage, extensions ---
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema extensions; create extension pgcrypto with schema extensions;
grant usage on schema extensions to anon, authenticated;
create schema auth;
create table auth.users (instance_id uuid, id uuid primary key, aud text, role text, email text,
  encrypted_password text, email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb,
  created_at timestamptz, updated_at timestamptz, confirmation_token text, email_change text,
  email_change_token_new text, recovery_token text);
create table auth.identities (id uuid primary key, provider_id text, user_id uuid references auth.users,
  identity_data jsonb, provider text, last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable
  as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
`);

for (const f of readdirSync(`${ROOT}migrations`).sort()) {
  await db.exec(readFileSync(`${ROOT}migrations/${f}`, 'utf8'));
  console.log('migración ok:', f);
}
await db.exec(readFileSync(`${ROOT}seed.sql`, 'utf8'));
console.log('seed ok\n');

const C = 'a0000000-0000-4000-8000-000000000001';
const PL = 'a0000000-0000-4000-8000-000000000002';
const PS = 'a0000000-0000-4000-8000-000000000003';
const C2 = 'a0000000-0000-4000-8000-0000000000c2';
const EV = 'e0000000-0000-4000-8000-000000000001';
const CARIBE = 'c0000000-0000-4000-8000-000000000001';

let passed = 0, failed = 0;
async function as(uid, role = 'authenticated') {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
  if (uid || role === 'anon') await db.exec(`set role ${role};`);
}
async function one(sql) { return (await db.query(sql)).rows[0]; }
function check(name, ok, detail = '') {
  ok ? passed++ : failed++;
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? '  → ' + detail : ''}`);
}
async function expectError(name, sql, code) {
  try { await db.query(sql); check(name, false, 'no dio error'); }
  catch (e) { check(name, !code || e.code === code, `${e.code} ${e.message}`); }
}

// Segundo cliente (prueba del registro: el trigger crea usuarios)
await as(null);
await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values ('${C2}', 'c2@eventia.test', '{"full_name":"Ana","role":"admin"}')`);
check('registro crea usuarios y nunca da rol admin', (await one(`select role from public.usuarios where id='${C2}'`)).role === 'client');
check('seed: roles desde metadata', (await one(`select count(*)::int n from public.usuarios where role='provider'`)).n === 2);

// --- Cliente ---
await as(C);
check('cliente ve 5 lugares activos', (await one(`select count(*)::int n from lugares`)).n === 5);
check('cliente ve 30 categorías', (await one(`select count(*)::int n from categorias`)).n === 30);
check('cliente solo se ve a sí mismo en usuarios', (await one(`select count(*)::int n from usuarios`)).n === 1);
let t = await one(`select services_total::int s, total::int t from totales_evento where event_id='${EV}'`);
check('servicios con precio congelado y cantidad por invitado', t.s === 4700000, JSON.stringify(t));

await db.query(`insert into servicios_evento (event_id, service_id, unit_price, status) values ('${EV}', 'd0000000-0000-4000-8000-000000000005', 1, 'CONFIRMED')`);
let se = await one(`select unit_price::int p, status from servicios_evento where service_id='d0000000-0000-4000-8000-000000000005'`);
check('la app no puede fijar precio ni estado del servicio', se.p === 700000 && se.status === 'PENDING', JSON.stringify(se));
await db.query(`delete from servicios_evento where service_id='d0000000-0000-4000-8000-000000000005'`);

await expectError('cliente no cambia el estado del evento', `update eventos set status='BOOKED' where id='${EV}'`, 'EV403');
await expectError('cliente no inserta reservas directo', `insert into reservas (event_id, venue_id, period, venue_price) values ('${EV}', '${CARIBE}', tstzrange(now(), now()+interval '1h'), 0)`);
await expectError('cliente no se da rol admin', `update usuarios set role='admin' where id='${C}'`, 'EV403');

const r1 = (await one(`select crear_reserva('${EV}', '${CARIBE}') id`)).id;
check('crear_reserva', !!r1);
check('evento pasa a PLANNED', (await one(`select status from eventos where id='${EV}'`)).status === 'PLANNED');
t = await one(`select total::int t, remaining::int r, venue_price::int v from totales_evento where event_id='${EV}'`);
check('total del ejemplo §16 = 6.700.000, sobran 1.300.000', t.t === 6700000 && t.r === 1300000, JSON.stringify(t));
let p = await one(`select lower(period) l, upper(period) u from reservas where id='${r1}'`);
check('evento 6 p. m. a 12 a. m. termina al día siguiente', new Date(p.u) - new Date(p.l) === 6 * 3600e3, `${p.l.toISOString()} → ${p.u.toISOString()}`);
await expectError('una sola reserva activa por evento', `select crear_reserva('${EV}', '${CARIBE}')`, 'EV409');
await expectError('valorar antes del evento', `insert into valoraciones (user_id, venue_id, rating) values ('${C}', '${CARIBE}', 5)`);

// --- Segundo cliente pide el mismo salón, horario cruzado ---
await as(C2);
check('C2 no ve el evento de C', (await one(`select count(*)::int n from eventos`)).n === 0);
await db.query(`insert into eventos (id, user_id, event_type_id, name, date, start_time, end_time, guests)
  select 'e0000000-0000-4000-8000-0000000000c2', '${C2}', id, 'Cumpleaños de Ana', '2026-12-15', '20:00', '02:00', 90
  from categorias where type='event' and name='Cumpleaños'`);
const r2 = (await one(`select crear_reserva('e0000000-0000-4000-8000-0000000000c2', '${CARIBE}') id`)).id;
check('solicitud pendiente cruzada permitida', !!r2);

// --- Dueño del lugar ---
await as(PL);
check('proveedor ve las 2 solicitudes de su lugar', (await one(`select count(*)::int n from reservas`)).n === 2);
check('proveedor ve a sus 2 clientes y a sí mismo', (await one(`select count(*)::int n from usuarios`)).n === 3);
check('confirmar primera', (await one(`select responder_reserva('${r1}', true) s`)).s === 'CONFIRMED');
await expectError('no se confirman dos reservas cruzadas', `select responder_reserva('${r2}', true)`, 'EV409');
await db.query(`update perfiles_proveedor set verified=false where user_id='${PL}'`);
check('proveedor no cambia su verificación', (await one(`select verified from perfiles_proveedor where user_id='${PL}'`)).verified === true);
await db.exec(`insert into storage.objects (bucket_id, name) values ('lugares', 'b0000000-0000-4000-8000-000000000001/salon.jpg')`);
check('sube foto a su carpeta', true);
await expectError('no sube foto a carpeta ajena', `insert into storage.objects (bucket_id, name) values ('lugares', 'b0000000-0000-4000-8000-000000000002/x.jpg')`);

await as(C);
check('con servicios pendientes el evento sigue PLANNED', (await one(`select status from eventos where id='${EV}'`)).status === 'PLANNED');

// --- Proveedor de servicios ---
await as(PS);
const ids = (await db.query(`select id from servicios_evento where event_id='${EV}'`)).rows;
check('proveedor de servicios ve sus 3 solicitudes', ids.length === 3);
for (const { id } of ids) await db.query(`select responder_servicio('${id}', true)`);

await as(C);
check('todo confirmado: evento BOOKED', (await one(`select status from eventos where id='${EV}'`)).status === 'BOOKED');
await expectError('no se mueve la fecha con reserva confirmada', `update eventos set date='2026-12-20' where id='${EV}'`, 'EV409');
const occ = (await db.query(`select status from ocupacion_lugar('${CARIBE}', '2026-12-14', '2026-12-20')`)).rows.map((r) => r.status);
check('calendario combina bloqueos y reservas', occ.join(',') === 'RESERVED,PENDING,BLOCKED,BLOCKED', occ.join(','));

// --- Bloqueo del proveedor ---
await as(C2);
await db.query(`select cancelar_reserva('${r2}')`);
check('cancelar vuelve el evento a DRAFT', (await one(`select status from eventos where id='e0000000-0000-4000-8000-0000000000c2'`)).status === 'DRAFT');
await db.query(`update eventos set date='2026-12-17' where id='e0000000-0000-4000-8000-0000000000c2'`);
await expectError('no se reserva en día bloqueado', `select crear_reserva('e0000000-0000-4000-8000-0000000000c2', '${CARIBE}')`, 'EV409');
await db.query(`update eventos set date='2026-12-18', guests=200 where id='e0000000-0000-4000-8000-0000000000c2'`);
await expectError('capacidad del lugar', `select crear_reserva('e0000000-0000-4000-8000-0000000000c2', '${CARIBE}')`, 'EV409');

// --- Anónimo ---
await as(null, 'anon');
check('anónimo lee categorías', (await one(`select count(*)::int n from categorias`)).n === 30);
await expectError('anónimo no lee lugares', `select * from lugares`);

// --- Cierre ---
await as(null);
check('completar_eventos_pasados no toca eventos futuros', (await one(`select completar_eventos_pasados() n`)).n === 0);

console.log(`\n${passed} pasaron, ${failed} fallaron`);
process.exit(failed ? 1 : 0);
