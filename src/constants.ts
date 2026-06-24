import type { Priority, Status } from './types'

/** Rótulos e ordem das prioridades MoSCoW (do mais para o menos urgente). */
export const PRIORITIES: { value: Priority; label: string; rank: number }[] = [
  { value: 'must', label: 'Must — preciso', rank: 0 },
  { value: 'should', label: 'Should — deveria', rank: 1 },
  { value: 'could', label: 'Could — poderia', rank: 2 },
  { value: 'wont', label: "Won't — talvez não", rank: 3 },
]

export const PRIORITY_RANK: Record<Priority, number> = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, p.rank]),
) as Record<Priority, number>

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'wanted', label: 'Quero' },
  { value: 'bought', label: 'Comprado' },
]

/**
 * Categorias sugeridas — extraídas da lista de desejos original do usuário.
 * São apenas sugestões: o campo de categorias é livre.
 */
export const SUGGESTED_CATEGORIES = [
  'Rotina & Cuidados Pessoais',
  'Saúde & Treino',
  'Gatos',
  'Roupa & Acessórios',
  'Casa & Organização',
  'Trabalho & Estudo',
  'Tecnologia',
  'Outros',
]
