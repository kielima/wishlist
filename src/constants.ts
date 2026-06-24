import type { Priority, Status } from './types'

export interface PriorityMeta {
  value: Priority
  /** Rótulo curto ("Must"). */
  label: string
  /** Rótulo completo ("Must — preciso"). */
  full: string
  /** Ordem de urgência (0 = mais urgente). */
  rank: number
  /** Quantos dos 4 traços do medidor ficam preenchidos. */
  ticks: number
  /** Largura da barra de prioridade. */
  pct: string
}

/** Prioridades MoSCoW (do mais para o menos urgente). */
export const PRIORITIES: PriorityMeta[] = [
  { value: 'must', label: 'Must', full: 'Must — preciso', rank: 0, ticks: 4, pct: '100%' },
  { value: 'should', label: 'Should', full: 'Should — deveria', rank: 1, ticks: 3, pct: '75%' },
  { value: 'could', label: 'Could', full: 'Could — poderia', rank: 2, ticks: 2, pct: '50%' },
  { value: 'wont', label: "Won't", full: "Won't — talvez não", rank: 3, ticks: 1, pct: '25%' },
]

export const PRIORITY_META: Record<Priority, PriorityMeta> = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, p]),
) as Record<Priority, PriorityMeta>

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'wanted', label: 'Quero' },
  { value: 'bought', label: 'Comprado' },
]

/**
 * Categorias sugeridas — extraídas da lista de desejos original do usuário.
 * O campo é livre; estas são apenas as opções rápidas na tela de edição.
 */
export const CATEGORIES = [
  'Cuidados Pessoais',
  'Saúde & Treino',
  'Gatos',
  'Roupa & Acessórios',
  'Casa & Organização',
  'Trabalho & Estudo',
  'Tecnologia',
  'Outros',
]
