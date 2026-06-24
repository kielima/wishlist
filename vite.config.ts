import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => {
  // O repositório se chama "wishlist", então o GitHub Pages serve em /wishlist/.
  // Em dev (serve) usamos "/" para não atrapalhar o localhost.
  const base = command === 'build' ? '/wishlist/' : '/'

  return {
    base,
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
