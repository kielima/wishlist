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
app-produtividade, com as tabelas (`items`, `item_ratings`, `app_version`) num
schema dedicado `wishlist` em vez do `public`. O schema é definido uma vez no
`createClient` (`src/supabase.ts`), então os repositórios seguem chamando
`.from('items')` normalmente.

O runbook da consolidação — incluindo backup, cópia de dados e a configuração
de *Exposed schemas* que precisa ser feita pelo dashboard — está em
[`docs/CONSOLIDACAO_SUPABASE.md`](https://github.com/kielima/app-produtividade/blob/main/docs/CONSOLIDACAO_SUPABASE.md)
no repo do app-produtividade.

## Decisão com AHP

O botão **Decidir** (ao lado de Duelo) abre um assistente AHP (Saaty): critérios
com pesos por comparação par-a-par (escala 1–9), itens comparados em cada
critério e ranking final. Mostra a razão de consistência (CR) e avisa quando
CR ≥ 0,1. A matemática é pura em `src/lib/ahp.ts`; o estado fica em
`localStorage` (por aparelho), sem Supabase.

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
