# Fase 2 — Sincronização entre aparelhos (Supabase)

Passos para ligar a sincronização. Só precisa fazer uma vez.

> **Projeto compartilhado.** A wishlist não tem mais projeto Supabase próprio:
> desde a consolidação, usa o mesmo projeto do app-produtividade
> (`robwqxgllzxbxwnjkyic`), com as tabelas num schema dedicado `wishlist`.
> Não crie um projeto novo — os passos 1 e 2 abaixo só valem para montar um
> ambiente do zero.

## 1. Criar o projeto no Supabase
*(Já feito — pule para o passo 3, usando o projeto existente.)*

1. Acesse https://supabase.com e crie uma conta (pode usar o GitHub).
2. **New project** → escolha um nome, defina uma senha de banco
   (guarde-a) e a região mais próxima (ex: South America / São Paulo).
3. Espere ~2 min o projeto provisionar.

## 2. Criar as tabelas
*(Já feito no projeto consolidado.)*

1. No menu lateral, **SQL Editor** → **New query**.
2. Cole o conteúdo de
   [`../supabase/migrations/0005_consolidate_into_shared_project.sql`](../supabase/migrations/0005_consolidate_into_shared_project.sql)
   e clique **Run**.
3. Deve aparecer "Success". Isso cria o schema `wishlist` com `items`,
   `item_ratings` e `app_version`, todas com segurança por usuário (RLS).
4. **Project Settings → API → Exposed schemas:** adicione `wishlist` à lista.
   Sem isso o PostgREST recusa todas as consultas do app.

## 3. Configurar o login por link mágico
1. **Authentication → Sign In / Providers**: confirme que **Email** está habilitado.
2. **Authentication → URL Configuration**:
   - **Site URL:** `https://kielima.github.io/wishlist/`
   - **Redirect URLs:** adicione também:
     - `https://kielima.github.io/wishlist/`
     - `http://localhost:5173/` (para desenvolvimento)

## 4. Pegar as chaves
1. **Project Settings → API**.
2. Copie:
   - **Project URL** (ex: `https://xxxx.supabase.co`)
   - **anon public** key (a chave pública — pode ser exposta com RLS ligado)
3. Envie as duas ao Claude. Ele configura o `.env.local`, as variáveis do GitHub
   Actions e publica.

A `anon key` é segura de ficar pública porque o RLS garante que cada pessoa só
acessa os próprios dados.
