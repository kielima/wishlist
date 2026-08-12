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
  plugins: {
    // Login com Google nativo no APK. `skipNativeAuth: true` faz o plugin só
    // abrir o seletor de contas do Android e devolver o idToken do Google —
    // ele nunca cria sessão no Firebase. Quem recebe esse idToken e mantém a
    // sessão é o Supabase (`signInWithIdToken`, ver src/auth.ts).
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
}

export default config
