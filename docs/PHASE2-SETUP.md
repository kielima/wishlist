# Fase 2 — Sincronização entre aparelhos (Supabase)

Passos para ligar a sincronização. Só precisa fazer uma vez.

## 1. Criar o projeto no Supabase
1. Acesse https://supabase.com e crie uma conta (pode usar o GitHub).
2. **New project** → escolha um nome (ex: `wishlist`), defina uma senha de banco
   (guarde-a) e a região mais próxima (ex: South America / São Paulo).
3. Espere ~2 min o projeto provisionar.

## 2. Criar a tabela
1. No menu lateral, **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`supabase-setup.sql`](./supabase-setup.sql) e clique **Run**.
3. Deve aparecer "Success". Isso cria a tabela `items` com segurança por usuário (RLS).

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
