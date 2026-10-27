-- =====================================================================
-- Eventia — 3. Storage: fotos de lugares.
-- Ruta de cada archivo: lugares/<id del perfil de proveedor>/<archivo>
-- La URL pública se guarda en imagenes_lugar.image_url.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lugares', 'lugares', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "lugares: lectura pública"
  on storage.objects for select
  using (bucket_id = 'lugares');

create policy "lugares: el proveedor sube a su carpeta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lugares'
    and (storage.foldername(name))[1] = (select public.mi_proveedor_id())::text
  );

create policy "lugares: el proveedor reemplaza en su carpeta"
  on storage.objects for update to authenticated
  using (bucket_id = 'lugares' and (storage.foldername(name))[1] = (select public.mi_proveedor_id())::text)
  with check (bucket_id = 'lugares' and (storage.foldername(name))[1] = (select public.mi_proveedor_id())::text);

create policy "lugares: el proveedor borra en su carpeta"
  on storage.objects for delete to authenticated
  using (bucket_id = 'lugares' and (storage.foldername(name))[1] = (select public.mi_proveedor_id())::text);
