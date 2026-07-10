# Wishlist para Android (app nativo)

Este projeto Android envolve o mesmo PWA (via [Capacitor](https://capacitorjs.com/))
só para dar à Wishlist um **WebView interno de verdade** — necessário para
completar itens de lojas que bloqueiam o scraping da Edge Function `clip` por
reputação de IP (ex.: Mercado Livre). Rodando no aparelho do usuário, o
WebView acessa a página como um navegador comum, sem esse bloqueio.

Para o dia a dia (adicionar/editar desejos, ver a lista), continue usando o
PWA normal — este app só resolve o caso das lojas bloqueadas.

## Como funciona

1. Você compartilha um link (ex.: do app do Mercado Livre) e escolhe
   **Wishlist** no menu de compartilhar do Android.
2. O app abre a página num WebView **oculto** (invisível para você) e lê nome,
   preço e foto do produto — igual a extensão de navegador faz no desktop.
3. O formulário "Novo desejo" abre já preenchido com o que foi encontrado.

Se um item já existe na wishlist com o mesmo link (ex.: salvo pelo celular via
PWA sem foto/preço), o app **completa esse item** em vez de criar um
duplicado, e mostra sugestões de nome/preço/foto para aplicar com um toque.

## Como instalar

Não há build publicado — instale via **sideload**:

1. Vá em **Actions → Build Android APK** neste repositório e rode o workflow
   (botão "Run workflow"). Ao terminar, baixe o artefato `wishlist-debug-apk`.
2. Transfira o `.apk` para o celular (Google Drive, e-mail, cabo USB, etc.).
3. No Android, abra o arquivo — se for a primeira vez instalando um APK fora
   da Play Store, o sistema vai pedir para permitir "instalar apps
   desconhecidos" para o app usado para abrir o arquivo (Arquivos, Chrome,
   etc.). Autorize e conclua a instalação.
4. Abra o app **Wishlist** uma vez para ele aparecer no menu de compartilhar.

## Build local (com Android Studio / SDK instalado)

```bash
CAPACITOR_BUILD=1 npm run build # gera dist/ com base "/" (não "/wishlist/" do GitHub Pages)
npx cap sync android            # copia o build + plugins pro projeto Android
cd android
./gradlew assembleDebug
# APK em android/app/build/outputs/apk/debug/app-debug.apk
```

`CAPACITOR_BUILD=1` é obrigatório: sem ele o build usa a base do GitHub Pages
(`/wishlist/`) e os assets dão 404 dentro do WebView do app — a tela abre em
branco.

## Atualizando depois de mudar o código web

Sempre que mudar algo em `src/`, repita
`CAPACITOR_BUILD=1 npm run build && npx cap sync android` antes de gerar um
novo APK — o WebView carrega os arquivos copiados para
`android/app/src/main/assets/public`, não os fontes diretamente.
