// Verificação e instalação automática de atualização do app, no Android.
//
// O workflow "Build Android APK" publica cada build da main no Supabase:
// sobe o APK para o bucket público "app-builds" e grava a linha
// `app_version` com o commit construído e a URL do APK. Aqui lemos essa
// linha (leitura pública, sem login), comparamos o commit publicado com o
// da build instalada (__APP_COMMIT__) e, se for diferente, já baixamos o
// APK e abrimos o instalador via o plugin nativo `Atualizador` — sem
// esperar nenhuma ação do usuário.

import { Capacitor, registerPlugin } from '@capacitor/core'
import { isSupabaseConfigured, supabase } from './supabase'

interface AtualizadorPlugin {
  // Baixa o APK da URL e abre o instalador do Android. Resolve quando o
  // instalador é aberto; rejeita se o download falhar.
  baixarEInstalar(options: { url: string }): Promise<void>
}

const Atualizador = registerPlugin<AtualizadorPlugin>('Atualizador')

// Commit da build instalada (vazio em build de desenvolvimento).
export const COMMIT_ATUAL = __APP_COMMIT__

/**
 * Verifica se há uma build nova publicada e, se houver, já baixa o APK e
 * abre o instalador sozinho. Retorna true quando iniciou o download (útil
 * para mostrar um aviso), false quando não havia nada a fazer.
 */
export async function verificarEInstalarAtualizacao(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'android') return false
  if (!isSupabaseConfigured || !supabase) return false
  if (!COMMIT_ATUAL) return false // build de dev, sem commit carimbado

  const { data, error } = await supabase.from('app_version').select('commit, apk_url').eq('id', 1).maybeSingle()
  if (error || !data?.apk_url) return false

  const remoto = data.commit ? data.commit.slice(0, 7) : null
  const atual = COMMIT_ATUAL.slice(0, 7)
  if (!remoto || remoto === atual) return false

  await Atualizador.baixarEInstalar({ url: data.apk_url })
  return true
}
