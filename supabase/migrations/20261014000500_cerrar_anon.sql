-- =====================================================================
-- Eventia — 5. Sin sesión solo se leen categorías.
-- Supabase da por defecto todos los privilegios a `anon` en public. RLS ya
-- devolvía cero filas; esto además cierra las tablas para quien no inició sesión.
-- =====================================================================

revoke all on all tables in schema public from anon;
grant select on public.categorias to anon;

-- Tablas que se creen en el futuro tampoco quedan abiertas a anon.
alter default privileges in schema public revoke all on tables from anon;
