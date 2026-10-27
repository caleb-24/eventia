# Base de datos de Eventia (Supabase)

Diseño y justificación: [`../../docs/DIAGRAMA_BD.md`](../../docs/DIAGRAMA_BD.md).

| Archivo | Contenido |
|---|---|
| `migrations/…_esquema.sql` | Tipos, 13 tablas, restricciones, índices, vista `totales_evento` |
| `migrations/…_reglas_y_seguridad.sql` | Reglas de reserva (§27), funciones RPC, triggers de protección, RLS |
| `migrations/…_storage.sql` | Bucket `lugares` para fotos y sus políticas |
| `migrations/…_categorias.sql` | Tipos de evento, lugar y servicio (§7, §8) |
| `migrations/…_cerrar_anon.sql` | Sin sesión solo se leen categorías |
| `seed.sql` | **Datos de prueba** (§28): 3 cuentas, 5 lugares, 5 servicios, 1 evento |
| `tests/reglas.test.mjs` | 36 pruebas de reglas y seguridad en un Postgres embebido |

## Proyecto actual

- Proyecto: **eventia** · ref `lwlimliueexpusrmbdns` · región São Paulo (`sa-east-1`) · [dashboard](https://supabase.com/dashboard/project/lwlimliueexpusrmbdns)
- Ya aplicado: las 5 migraciones y el seed. Auth con Site URL `eventia://` y redirecciones de la app.
- La app ya apunta aquí (`eventia-app/.env`, solo la clave pública).
- Contraseña de la base: fuera del proyecto, en `~/.config/eventia/supabase-db-password` (solo tu usuario puede leerla). `db push` la pide; para no escribirla: `SUPABASE_DB_PASSWORD=$(cat ~/.config/eventia/supabase-db-password) npx supabase db push`. No guardes secretos dentro de `eventia-app/`: Metro y el editor leen esa carpeta.

### Cambios futuros

```bash
npx supabase migration new nombre_del_cambio   # crea supabase/migrations/<fecha>_nombre_del_cambio.sql
npm run test:db                                # prueba local
npx supabase db push                           # aplica al proyecto
npm run db:types                               # actualiza src/types/database.ts
```

`config.toml` está alineado con el proyecto remoto. Antes de `npx supabase config push`, revisa el diff que muestra: cualquier diferencia se aplica al proyecto real (por ejemplo, desactivar la confirmación de correo).

## Crear la base en otro proyecto

1. Crea el proyecto en [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**. Nombre `eventia`, región **South America (São Paulo)** (la más cercana a Colombia). Guarda la contraseña de la base.
2. Desde `eventia-app/`:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>        # el ref está en la URL del dashboard
   npx supabase db push --dry-run               # revisa qué se va a aplicar
   npx supabase db push --include-seed          # sin --include-seed en producción
   ```
3. En **Authentication → URL Configuration**:
   - Site URL: `eventia://`
   - Redirect URLs: `eventia://recuperar-contrasena` y `exp://**`
4. En **Project Settings → API** copia la URL y la clave pública (publishable/anon) a `eventia-app/.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<clave pública>
   ```
   Nunca pongas la `service_role` / secret key en la app.
5. Reinicia `npx expo start`. La etiqueta "Modo demo" desaparece y el login usa Supabase.

### Cierre diario de eventos

Para que las reservas pasadas queden `COMPLETED` (y se puedan valorar), activa **pg_cron** en Database → Extensions y ejecuta una vez en el SQL Editor:

```sql
select cron.schedule('completar-eventos', '0 7 * * *', $$select public.completar_eventos_pasados()$$);
```

(07:00 UTC = 2:00 a. m. en Colombia.)

## Correo de confirmación

> **Temporal:** la confirmación de correo está **desactivada** (`enable_confirmations = false` en `config.toml`) porque el correo por defecto de Supabase solo permite unos pocos envíos por hora. Al configurar el SMTP propio, vuelve a `true`, descomenta las plantillas y ejecuta `npx supabase config push`.

- Hoy: Supabase envía su correo por defecto (en inglés, con **enlace**) y solo a correos del equipo del proyecto, con pocos envíos por hora. La app acepta el enlace ("Ya abrí el enlace: iniciar sesión").
- Para usuarios reales y el **código de 8 dígitos**: configura un SMTP propio (Gmail con contraseña de aplicación) en **Authentication → Emails → SMTP Settings**, descomenta las plantillas en `config.toml` y ejecuta `npx supabase config push`. Las plantillas en español están en `supabase/templates/`.

## Enlaces del correo y Expo Go

Supabase **no acepta redirecciones a IP privadas** (`exp://192.168.x.x:8081`, la dirección de Expo Go en la red local) y las cambia por `eventia://`, que Expo Go no abre. Por eso:

- Redirect URLs permitidas: `eventia://**` (app instalada) y `exp://*.exp.direct/**` (Expo Go con `npx expo start --tunnel`). No uses `**`: permitiría redirigir la sesión a cualquier sitio.
- En la app, "¿El enlace no abre la app?" permite **pegar el enlace del correo**; la app lo canjea directo con Supabase (`verifyOtp` con `token_hash`), sin depender de que el enlace abra la app.

## Cuentas de prueba (seed)

Contraseña de todas: `Eventia2026`.

| Correo | Rol | Tiene |
|---|---|---|
| `cliente@eventia.test` | Cliente | Evento "Graduación Ingeniería de Sistemas (prueba)", 15 dic, 120 invitados, 3 servicios |
| `proveedor.lugares@eventia.test` | Proveedor | 5 lugares en Riohacha |
| `proveedor.servicios@eventia.test` | Proveedor | 5 servicios |

## Cómo la usa la app

- **Lecturas y escrituras normales**: `supabase.from('lugares').select()`, etc. RLS decide qué ve cada quien.
- **Reservas**: solo por funciones, nunca escribiendo en `reservas`:

| Función | Quién | Qué hace |
|---|---|---|
| `crear_reserva(p_event_id, p_venue_id)` | Cliente | Valida §27 (fecha futura, lugar activo, capacidad, día no bloqueado, horario libre) y crea la solicitud `PENDING` |
| `responder_reserva(p_reserva_id, p_aceptar)` | Dueño del lugar | `CONFIRMED` o `REJECTED`. Rechaza si ya confirmó otra en ese horario |
| `cancelar_reserva(p_reserva_id)` | Cliente o dueño | `CANCELLED`, antes de que empiece el evento |
| `responder_servicio(p_servicio_evento_id, p_aceptar)` | Proveedor del servicio | Acepta o rechaza su parte |
| `ocupacion_lugar(p_venue_id, p_desde, p_hasta)` | Cualquiera con sesión | Calendario: AVAILABLE, BLOCKED, PENDING, RESERVED |

  Ejemplo: `supabase.rpc('crear_reserva', { p_event_id, p_venue_id })`.

- **Errores**: las funciones devuelven el mensaje listo en español en `error.message` y un código en `error.code`: `EV400` dato no válido, `EV401` sin sesión, `EV403` sin permiso, `EV404` no existe o no es tuyo, `EV409` conflicto de estado u horario.
- **El estado del evento** (`DRAFT → PLANNED → BOOKED → COMPLETED`) lo calcula la base; la app no lo escribe.
- **Precios**: `servicios_evento.unit_price` y `reservas.venue_price` los fija la base al agregar o reservar.

## Tipos para TypeScript

Después de `link`:

```bash
npx supabase gen types --linked --lang typescript --schema public > src/types/database.ts
```

## Probar sin proyecto ni Docker

```bash
npm run test:db
```

Carga las migraciones y el seed en PGlite (Postgres 17 embebido) y prueba reservas, cruces de horario, RLS y Storage. No reemplaza probar en Supabase: `auth` y `storage` son simulados.
