-- Versão publicada do app Android, para o verificador de atualização in-app.
-- Linha única (id fixo em 1): commit construído + URL pública do APK no
-- Storage. Leitura pública (o app consulta sem login); escrita só pela
-- service role, usada pelo workflow de CI após o build.
create table if not exists public.app_version (
  id smallint primary key default 1 check (id = 1),
  commit text not null,
  apk_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_version enable row level security;

create policy "app_version_public_read" on public.app_version
  for select using (true);

-- Bucket público para hospedar o APK baixado pelo verificador de atualização.
insert into storage.buckets (id, name, public)
values ('app-builds', 'app-builds', true)
on conflict (id) do nothing;

create policy "app_builds_public_read" on storage.objects
  for select using (bucket_id = 'app-builds');
