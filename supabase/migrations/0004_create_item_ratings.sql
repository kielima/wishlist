-- Ranking por duelos: rating Glicko-2 (r, rd, sigma) de cada item, mantido
-- em tabela separada dos itens. A única coisa que volta pra `items` é o
-- efeito de ordenação em tela — nenhuma coluna de `items` é tocada aqui.
create table if not exists public.item_ratings (
  item_id    uuid primary key references public.items (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  r          double precision not null default 1500,
  rd         double precision not null default 350,
  sigma      double precision not null default 0.06,
  updated_at timestamptz not null default now()
);

alter table public.item_ratings enable row level security;

drop policy if exists "Users manage own item ratings" on public.item_ratings;
create policy "Users manage own item ratings"
  on public.item_ratings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists item_ratings_user_id_idx on public.item_ratings (user_id);
