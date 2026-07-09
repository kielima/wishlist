import type { CapacitorConfig } from '@capacitor/cli'

// App Android que envolve o mesmo PWA (mesmo build, dist/). Existe só para dar
// à Wishlist um navegador interno de verdade (WebView nativo) — necessário
// para completar itens de lojas que bloqueiam o scraping da Edge Function por
// reputação de IP (ex.: Mercado Livre): rodando no aparelho do usuário, o
// WebView acessa a página como um navegador comum, sem o bloqueio.
const config: CapacitorConfig = {
  appId: 'br.com.kielima.wishlist',
  appName: 'Wishlist',
  webDir: 'dist',
}

export default config
