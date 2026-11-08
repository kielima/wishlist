-- Sugestões de NOTA por item num critério do AHP, geradas fora do app (ex.:
-- pelo agente "Carreira" para o critério "Alinhamento com a carreira", que
-- entrou com a sugestão de pesos da migration 0007). Ver
-- docs/SUGESTAO_AHP_CARREIRA.md.
--
-- O app só LÊ a nota mais recente por (item_id, critério) da própria pessoa e
-- a oferece no passo "Itens por critério" do assistente AHP com "Aplicar nas
-- que faltam" / "Ignorar". Nunca aplica sozinho e, por padrão, não sobrescreve
-- avaliações já feitas. O estado da decisão AHP continua em localStorage
-- (src/lib/ahpStore.ts).
--
-- Escala de `score`: a mesma do modo "notas" do AHP, inteiro de 1 (pior) a 9
-- (melhor), com 5 = médio. O que conta é a proporção entre as notas (8 vale o
-- dobro de 4).
--
-- `criterion`: nome do critério como aparece no AHP (o app compara sem acento
-- nem caixa), até 30 caracteres. `justification`: uma linha geral, opcional,
-- até 200 caracteres. Nada de conteúdo do vault de carreira (repo público).
--
-- Escrita: só service_role (SQL editor / agente com chave de serviço). O
-- cliente autenticado não tem insert/update/delete.
--
-- Rollback:
--   drop table if exists wishlist.ahp_item_score_suggestions;

create table if not exists wishlist.ahp_item_score_suggestions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id       uuid not null references wishlist.items(id) on delete cascade,
  criterion     text not null,
  score         numeric not null,
  justification text,
  generated_at  timestamptz not null default now(),
  constraint ahp_item_score_suggestions_criterion_check check (char_length(criterion) between 1 and 30),
  constraint ahp_item_score_suggestions_score_check check (score between 1 and 9 and score = trunc(score)),
  constraint ahp_item_score_suggestions_justification_check check (justification is null or char_length(justification) <= 200)
);

create index if not exists ahp_item_score_suggestions_user_crit_generated_idx
  on wishlist.ahp_item_score_suggestions (user_id, criterion, generated_at desc);

alter table wishlist.ahp_item_score_suggestions enable row level security;

create policy "Users read own ahp item score suggestions" on wishlist.ahp_item_score_suggestions
  for select to authenticated
  using (auth.uid() = user_id);

grant select on wishlist.ahp_item_score_suggestions to authenticated;
grant all on wishlist.ahp_item_score_suggestions to service_role;
