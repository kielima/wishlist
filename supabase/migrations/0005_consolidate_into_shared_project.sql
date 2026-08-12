-- Consolidação dos dois projetos Supabase num só.
--
-- A wishlist deixa de ter projeto próprio e passa a viver dentro do projeto
-- do app-produtividade (ref robwqxgllzxbxwnjkyic), num schema dedicado.
--
-- Por que schema separado e não prefixo no `public`: as duas bases tinham uma
-- tabela `app_version` cada, com formatos diferentes (id int4 vs int2,
-- `atualizado_em` vs `updated_at`, nullability distinta) e ciclos de release
-- independentes — são duas linhas que precisam coexistir, não uma só. Um
-- schema por app resolve a colisão e isola os dois; como o supabase-js aceita
-- schema padrão no createClient (ver src/supabase.ts), nenhum `.from()` dos
-- repositórios precisou mudar.
--
-- Espelha exatamente o schema do projeto de origem (jwmuwogwutiiuvewhkku):
-- mesmos tipos, defaults, constraints, índices e policies.

create schema if not exists wishlist;

grant usage on schema wishlist to anon, authenticated, service_role;

create table if not exists wishlist.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  description text not null default ''::text,
  link        text not null default ''::text,
  price_cents integer,
  priority    text not null default 'should'::text,
  status      text not null default 'wanted'::text,
  categories  text[] not null default '{}'::text[],
  photo       text,
  receipt     jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  currency    text not null default 'BRL'::text,
  favorite    boolean not null default false,
  constraint items_currency_check
    check (currency = any (array['BRL'::text, 'USD'::text, 'EUR'::text, 'CNY'::text]))
);

create index if not exists items_user_id_idx on wishlist.items (user_id);

create table if not exists wishlist.item_ratings (
  item_id    uuid primary key references wishlist.items(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  r          double precision not null default 1500,
  rd         double precision not null default 350,
  sigma      double precision not null default 0.06,
  updated_at timestamptz not null default now()
);

create index if not exists item_ratings_user_id_idx on wishlist.item_ratings (user_id);

-- Singleton da versão publicada do APK da wishlist. Fica aqui, separada de
-- public.app_version (do app-produtividade): cada app tem seu próprio APK e
-- seu próprio ciclo de release, então são duas linhas independentes.
create table if not exists wishlist.app_version (
  id         smallint primary key default 1,
  commit     text not null,
  apk_url    text not null,
  updated_at timestamptz not null default now(),
  constraint app_version_id_check check (id = 1)
);

alter table wishlist.items        enable row level security;
alter table wishlist.item_ratings enable row level security;
alter table wishlist.app_version  enable row level security;

create policy "Users manage own items" on wishlist.items
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own item ratings" on wishlist.item_ratings
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Leitura pública: o verificador de atualização consulta sem login.
create policy "app_version_public_read" on wishlist.app_version
  for select using (true);

-- Num schema novo não valem os grants padrão do `public`, então são explícitos.
grant select, insert, update, delete on wishlist.items, wishlist.item_ratings to authenticated;
grant select on wishlist.app_version to anon, authenticated;
grant all on wishlist.items, wishlist.item_ratings, wishlist.app_version to service_role;

alter default privileges in schema wishlist grant all on tables to service_role;

-- Bucket público que hospeda o APK, lido pelo verificador de atualização
-- (src/nativeUpdate.ts). Vinha da migration 0003 no projeto de origem.
insert into storage.buckets (id, name, public)
values ('app-builds', 'app-builds', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'app_builds_public_read'
  ) then
    create policy "app_builds_public_read" on storage.objects
      for select using (bucket_id = 'app-builds');
  end if;
end $$;
