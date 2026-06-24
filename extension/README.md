# Wishlist Clipper — extensão (Chrome / Edge)

Salva o produto da aba atual direto na sua Wishlist, com nome, foto, link e
preço já preenchidos.

## Como instalar (uma vez)

1. Abra `chrome://extensions` (ou `edge://extensions`).
2. Ative o **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação** ("Load unpacked").
4. Selecione esta pasta (`extension/`).
5. O ícone do Wishlist Clipper aparece na barra. Clique no ícone do quebra-cabeça
   e **fixe** o Wishlist Clipper para tê-lo sempre à mão.

## Como usar

1. Abra a página de um produto em qualquer loja.
2. Clique no ícone do **Wishlist Clipper**.
3. A Wishlist abre numa aba nova com "Novo desejo" já preenchido — confira o
   preço (varia entre lojas) e clique em **Salvar**.

> O preço e a imagem são "melhor esforço": funcionam na maioria das lojas com
> dados estruturados, mas algumas (ex.: Amazon) bloqueiam leitura automática —
> nesses casos, complete o que faltar manualmente.

## Observação

A extensão abre `https://kielima.github.io/wishlist/`. Se você mudar o endereço
do app, atualize `APP_URL` em `background.js`.
