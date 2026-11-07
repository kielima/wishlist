-- Sugestões de pesos para os critérios do AHP, geradas fora do app (ex.: pelo
-- agente "Carreira" a partir dos objetivos de carreira de Kiê, que vivem num
-- vault privado que o app não lê). Ver docs/SUGESTAO_AHP_CARREIRA.md.
--
-- O app só LÊ a linha mais recente da própria pessoa e a oferece no assistente
-- AHP com "Aplicar sugestão" / "Ignorar" — nunca aplica sozinho. O estado da
-- decisão AHP continua em localStorage (src/lib/ahpStore.ts); esta tabela não
-- guarda julgamentos nem avaliações de itens.
--
-- Escrita: só service_role (SQL editor / agente com chave de serviço). O
-- cliente autenticado não tem insert/update/delete.
--
-- Formato de `criteria` (jsonb array, 2–8 elementos):
--   [{"name": "Preço", "weight": 0.2, "justification": "uma linha"}, ...]
-- `weight` > 0, não precisa somar 1 (o app normaliza).
--
-- Rollback:
--   drop table if exists wishlist.ahp_weight_suggestions;

create table if not exists wishlist.ahp_weight_suggestions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criteria     jsonb not null,
  source       text not null default 'objetivos de carreira',
  generated_at timestamptz not null default now(),
  constraint ahp_weight_suggestions_criteria_check check (
    jsonb_typeof(criteria) = 'array'
    and jsonb_array_length(criteria) between 2 and 8
  ),
  constraint ahp_weight_suggestions_source_check check (char_length(source) <= 60)
);

create index if not exists ahp_weight_suggestions_user_generated_idx
  on wishlist.ahp_weight_suggestions (user_id, generated_at desc);

alter table wishlist.ahp_weight_suggestions enable row level security;

create policy "Users read own ahp suggestions" on wishlist.ahp_weight_suggestions
  for select to authenticated
  using (auth.uid() = user_id);

grant select on wishlist.ahp_weight_suggestions to authenticated;
grant all on wishlist.ahp_weight_suggestions to service_role;
