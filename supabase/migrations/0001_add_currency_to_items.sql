-- Adiciona a moeda do preço de cada item. Itens existentes assumem BRL.
-- As telas convertem para BRL na exibição usando cotações recentes.
alter table public.items
  add column if not exists currency text not null default 'BRL'
  check (currency in ('BRL', 'USD', 'EUR', 'CNY'));
