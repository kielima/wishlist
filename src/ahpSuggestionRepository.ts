import { supabase } from './supabase'
import { parseSuggestion, type AhpSuggestion } from './lib/ahpSuggestion'
import { parseItemScoreRows, type ItemScoreSuggestion } from './lib/ahpItemScoreSuggestion'

/**
 * Última sugestão de pesos AHP da pessoa logada (tabela
 * `wishlist.ahp_weight_suggestions`, migration 0007). Só leitura: quem grava
 * é o agente, por SQL — ver docs/SUGESTAO_AHP_CARREIRA.md.
 *
 * Devolve null sem Supabase (modo local), sem linha, ou se a tabela ainda não
 * existir no projeto (migration não aplicada) — nesse caso o AHP segue igual.
 */
export async function fetchLatestSuggestion(): Promise<AhpSuggestion | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('ahp_weight_suggestions')
    .select('id, criteria, source, generated_at')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return parseSuggestion(data)
}

/**
 * Notas sugeridas por item (tabela `wishlist.ahp_item_score_suggestions`,
 * migration 0008), já reduzidas à mais recente por (item, critério). Só
 * leitura, como a sugestão de pesos.
 *
 * Devolve [] sem Supabase (modo local), sem linhas, ou se a tabela ainda não
 * existir (migration não aplicada) — nesse caso o AHP segue igual.
 */
export async function fetchItemScoreSuggestions(): Promise<ItemScoreSuggestion[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('ahp_item_score_suggestions')
    .select('item_id, criterion, score, justification, generated_at')
    .order('generated_at', { ascending: false })
    .limit(5000)
  if (error || !data) return []
  return parseItemScoreRows(data)
}
