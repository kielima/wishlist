-- ============================================================
-- Wishlist — configuração do banco no Supabase (Fase 2)
-- Cole tudo isto no SQL Editor do Supabase e clique em "Run".
-- ============================================================

-- Tabela de itens da wishlist.
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  -- Dono do item: preenchido automaticamente com o usuário logado.
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  description text not null default '',
  link        text not null default '',
  price_cents integer,
  priority    text not null default 'should',
  status      text not null default 'wanted',
  categories  text[] not null default '{}',
  photo       text,        -- foto como data URL (base64)
  receipt     jsonb,       -- nota fiscal { name, date, kind, dataUrl }
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security: cada pessoa só enxerga e mexe nos próprios itens.
alter table public.items enable row level security;

drop policy if exists "Users manage own items" on public.items;
create policy "Users manage own items"
  on public.items
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Índice para ordenar/filtrar rápido por usuário.
create index if not exists items_user_id_idx on public.items (user_id);
