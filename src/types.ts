// Modelo de dados central do app. Mantido independente da UI e da camada de
// armazenamento — tanto a interface quanto o repositório (local hoje, Supabase
// na Fase 2) dependem destes tipos.

/** Prioridade no esquema MoSCoW, alinhado à lista original do usuário. */
export type Priority = 'must' | 'should' | 'could' | 'wont'

/** Estado de aquisição do item. */
export type Status = 'wanted' | 'bought'

/** Nota fiscal anexada a um item comprado (foto ou PDF). */
export interface Receipt {
  name: string
  /** Data de arquivamento, formato pt-BR (dd/mm/aaaa). */
  date: string
  kind: 'image' | 'pdf'
  /** Conteúdo do arquivo como data URL (base64) — funciona offline. */
  dataUrl: string
}

export interface WishItem {
  /** UUID gerado no cliente (compatível com sync futura). */
  id: string
  name: string
  /** Texto livre — a "aba de descrição" pedida pelo usuário. */
  description: string
  /** URL da loja/referência (sem protocolo, ex: "amazon.com.br"). */
  link: string
  /** Preço estimado em centavos (evita erros de ponto flutuante). null = sem preço. */
  priceCents: number | null
  priority: Priority
  status: Status
  /** Categorias/tags. A primeira é tratada como categoria principal na UI. */
  categories: string[]
  /** Foto do item como data URL (base64). null = sem foto. */
  photo: string | null
  /** Nota fiscal arquivada (só faz sentido para itens comprados). */
  receipt: Receipt | null
  /** Timestamps ISO 8601 — úteis para ordenação e merge na sync futura. */
  createdAt: string
  updatedAt: string
}

/** Dados de entrada ao criar/editar (sem campos gerenciados pelo sistema). */
export type WishItemInput = Omit<WishItem, 'id' | 'createdAt' | 'updatedAt'>
