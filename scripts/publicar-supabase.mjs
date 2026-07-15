// Publica a build atual no Supabase, para o verificador de atualização in-app
// (src/nativeUpdate.ts): sobe o APK debug para o bucket público "app-builds"
// e grava a linha `app_version` (commit + URL do APK). O app lê essa linha
// (leitura pública, sem login), compara o commit com o da build instalada e
// baixa o APK se houver versão nova.
//
// Variáveis de ambiente:
//   SUPABASE_URL               URL do projeto (workflow)
//   SUPABASE_SERVICE_ROLE_KEY  service role key — só write, nunca no cliente
//   APP_COMMIT                 commit realmente construído (vai na linha)
//   APK_PATH                   caminho do APK debug gerado pelo gradle

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const commit = process.env.APP_COMMIT || ''
const apkPath = process.env.APK_PATH || 'android/app/build/outputs/apk/debug/app-debug.apk'

if (!url || !serviceRoleKey) {
  console.error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes — não dá para publicar.')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey)
const apk = readFileSync(apkPath)

const { error: uploadError } = await supabase.storage
  .from('app-builds')
  .upload('wishlist.apk', apk, { contentType: 'application/vnd.android.package-archive', upsert: true })
if (uploadError) {
  console.error('Falha ao subir o APK:', uploadError.message)
  process.exit(1)
}

const { data: publicUrlData } = supabase.storage.from('app-builds').getPublicUrl('wishlist.apk')
const apkUrl = publicUrlData.publicUrl

const { error: upsertError } = await supabase
  .from('app_version')
  .upsert({ id: 1, commit, apk_url: apkUrl, updated_at: new Date().toISOString() })
if (upsertError) {
  console.error('Falha ao gravar app_version:', upsertError.message)
  process.exit(1)
}

console.log(`Versão publicada · commit ${commit || '(vazio)'}`)
console.log(`APK: ${apkUrl}`)
