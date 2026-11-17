# Wishlist

PWA pessoal de lista de desejos — instalável, funciona offline.

## Stack

- **React + Vite + TypeScript**
- **PWA** via `vite-plugin-pwa` (instalável, offline-first)
- **IndexedDB** via [Dexie](https://dexie.org/) para armazenamento local
- Deploy automático no **GitHub Pages** a cada push na `main`

## Modelo de dados

Cada desejo tem: nome, descrição, foto, link, preço, prioridade (MoSCoW:
`must` / `should` / `could` / `wont`), categorias e status (`wanted` / `bought`).

### Backend Supabase (projeto compartilhado)

A wishlist não tem projeto Supabase próprio: usa o mesmo projeto do
app-produtividade, com as tabelas (`items`, `app_version` e as de sugestões do AHP) num
schema dedicado `wishlist` em vez do `public`. O schema é definido uma vez no
`createClient` (`src/supabase.ts`), então os repositórios seguem chamando
`.from('items')` normalmente.

O runbook da consolidação — incluindo backup, cópia de dados e a configuração
de *Exposed schemas* que precisa ser feita pelo dashboard — está em
[`docs/CONSOLIDACAO_SUPABASE.md`](https://github.com/kielima/app-produtividade/blob/main/docs/CONSOLIDACAO_SUPABASE.md)
no repo do app-produtividade.

## Decisão com AHP

O botão **Decidir** abre um assistente AHP (Saaty) que entra com **todos** os
itens desejados, exceto os de prioridade "Won't" — os filtros da tela não se
aplicam, então o "Ranking AHP" é o mesmo com qualquer filtro.
Critérios com pesos por comparação par-a-par (escala 1–9), depois todos os itens
avaliados em cada critério, de um de dois modos: comparação em pares (padrão até
7 itens, 21 pares por critério) ou nota 1–9 por item (modo de classificação do
AHP, padrão com 8 ou mais). A pessoa pode trocar o modo; a escolha fica salva.
Ranking final, razão de consistência (CR, aviso quando ≥ 0,1) e a ordenação
"Ranking AHP" na lista. Matemática pura em `src/lib/ahp.ts`, estado em
`src/lib/ahpStore.ts` (`localStorage`, por aparelho, sem Supabase).

Uma **sugestão de pesos** gerada por um agente a partir dos objetivos de
carreira (tabela `wishlist.ahp_weight_suggestions`, só leitura no app) pode
aparecer no assistente com "Aplicar sugestão" / "Ignorar" — nunca é aplicada
sozinha. Como funciona e como gerar: [`docs/SUGESTAO_AHP_CARREIRA.md`](docs/SUGESTAO_AHP_CARREIRA.md).
Testes das funções puras: `npm test` (vitest).

## Rodando localmente

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção em dist/
npm run preview  # serve o build localmente
```

## Arquitetura

A UI nunca fala direto com o banco — tudo passa pelo `WishlistRepository`
(`src/repository.ts`). Hoje a implementação é local (IndexedDB). Na **Fase 2**,
basta trocar a implementação por uma baseada em **Supabase** (auth + Postgres +
Storage) para sincronizar entre aparelhos, sem alterar a interface.

## App Android (opcional)

Para lojas que bloqueiam o scraping da Edge Function por IP (ex.: Mercado
Livre), há um app Android que envolve o PWA com um WebView interno de
verdade — veja [`android/README.md`](android/README.md).

## Roadmap

- [x] Fase 1 — app local-first funcional e instalável
- [ ] Interface final (a partir do design)
- [ ] Fase 2 — sincronização entre aparelhos (Supabase)
