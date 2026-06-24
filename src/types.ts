// Modelo de dados central do app. Mantido independente da UI e da camada de
// armazenamento — tanto a interface quanto o repositório (local hoje, Supabase
// na Fase 2) dependem destes tipos.

/** Prioridade no esquema MoSCoW, alinhado à lista original do usuário. */
export type Priority = 'must' | 'should' | 'could' | 'wont'

/** Estado de aquisição do item. */
export type Status = 'wanted' | 'bought'

export interface WishItem {
  /** UUID gerado no cliente (compatível com sync futura). */
  id: string
  name: string
  /** Texto livre — a "aba de descrição" pedida pelo usuário. */
  description: string
  /** URL da loja/referência. */
  link: string
  /** Preço estimado em centavos (evita erros de ponto flutuante). null = sem preço. */
  priceCents: number | null
  priority: Priority
  status: Status
  /** Nomes de categorias/tags. Livres, mas sugeridas em constants.ts. */
  categories: string[]
  /**
   * Foto do item. Guardada como data URL (base64) para funcionar 100% offline
   * sem servidor. Na Fase 2 vira uma URL do Supabase Storage.
   */
  photo: string | null
  /** Timestamps ISO 8601 — úteis para ordenação e merge na sync futura. */
  createdAt: string
  updatedAt: string
}

/** Dados de entrada ao criar/editar (sem campos gerenciados pelo sistema). */
export type WishItemInput = Omit<WishItem, 'id' | 'createdAt' | 'updatedAt'>
