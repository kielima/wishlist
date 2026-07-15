import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Commit realmente construído (definido no workflow a partir de
// `git rev-parse HEAD`), injetado como __APP_COMMIT__ para o verificador de
// atualização in-app comparar com a última build publicada no Supabase.
// Vazio em `npm run dev`/builds locais.
const commit = process.env.APP_COMMIT ?? ''

export default defineConfig(({ command }) => {
  // O repositório se chama "wishlist", então o GitHub Pages serve em /wishlist/.
  // Em dev (serve) usamos "/" para não atrapalhar o localhost. O app Android
  // (Capacitor) também precisa de "/": ele serve o WebView a partir da raiz
  // do próprio pacote, não de um subcaminho — com "/wishlist/" os assets
  // davam 404 e a tela ficava em branco. CAPACITOR_BUILD=1 sinaliza esse caso
  // — setar antes de `npm run build` ao gerar o build pro app Android.
  const base = command === 'build' && !process.env.CAPACITOR_BUILD ? '/wishlist/' : '/'

  return {
    base,
    define: {
      __APP_COMMIT__: JSON.stringify(commit),
    },
    plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Wishlist',
        short_name: 'Wishlist',
        description: 'Minha lista de desejos pessoal',
        theme_color: '#111111',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,
        scope: base,
        // Webclipper no celular: o app aparece no menu "Compartilhar".
        // Os dados chegam como query params na URL base e o app os processa.
        share_target: {
          action: base,
          method: 'GET',
          enctype: 'application/x-www-form-urlencoded',
          params: { title: 'title', text: 'text', url: 'url' },
        },
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      }),
    ],
  }
})
