-- Marca itens como favoritos (coração). Itens existentes não são favoritos.
alter table public.items
  add column if not exists favorite boolean not null default false;
