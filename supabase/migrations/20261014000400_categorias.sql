-- =====================================================================
-- Eventia — 4. Categorías base (§7 y §8). Datos reales, no de prueba.
-- =====================================================================

insert into public.categorias (type, name) values
  -- Tipos de evento (§7)
  ('event', 'Cumpleaños'),
  ('event', 'Boda'),
  ('event', 'Graduación'),
  ('event', 'Evento empresarial'),
  ('event', 'Conferencia'),
  ('event', 'Baby shower'),
  ('event', 'Aniversario'),
  ('event', 'Reunión familiar'),
  ('event', 'Evento escolar'),
  ('event', 'Evento universitario'),
  ('event', 'Evento social'),
  ('event', 'Otro'),
  -- Tipos de lugar (§8)
  ('venue', 'Salón'),
  ('venue', 'Casa de eventos'),
  ('venue', 'Finca'),
  ('venue', 'Restaurante'),
  ('venue', 'Centro de convenciones'),
  ('venue', 'Espacio abierto'),
  -- Servicios (§8)
  ('service', 'Alimentación'),
  ('service', 'Decoración'),
  ('service', 'Música'),
  ('service', 'Fotografía'),
  ('service', 'Video'),
  ('service', 'Animación'),
  ('service', 'Meseros'),
  ('service', 'Seguridad'),
  ('service', 'Transporte'),
  ('service', 'Sonido'),
  ('service', 'Iluminación'),
  ('service', 'Equipos audiovisuales')
on conflict (type, name) do nothing;
