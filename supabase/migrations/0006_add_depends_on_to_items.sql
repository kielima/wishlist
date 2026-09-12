-- Dependências entre itens: alguns itens (ex: DIY) só fazem sentido comprar
-- depois de outro item já ter sido comprado. `depends_on` guarda os IDs dos
-- itens pré-requisito; a validação de ciclo/existência fica no cliente.

alter table wishlist.items
  add column if not exists depends_on uuid[] not null default '{}'::uuid[];
