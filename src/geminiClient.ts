// Chamador compartilhado de features de IA (hoje só extração de produto a
// partir de foto). A chave da API Gemini vive só nos secrets do Supabase —
// este módulo chama a Edge Function `call-gemini`, que já existe no projeto
// Supabase compartilhado com o app-produtividade (é de lá que esse desenho
// vem: src/lib/geminiClient.ts + supabase/functions/call-gemini) e injeta a
// chave no servidor, repassando só o prompt/schema (nada sigiloso).
import { supabase } from './supabase'

export interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
  promptFeedback?: { blockReason?: string }
}

export async function callGemini(model: string, body: unknown): Promise<GeminiResponse> {
  if (!supabase) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.functions.invoke<GeminiResponse>('call-gemini', { body: { model, body } })
  if (error) {
    // FunctionsHttpError expõe a Response original em `context`; o corpo é o
    // JSON `{ error, message }` que a Edge Function devolve em falhas.
    const context = (error as { context?: Response }).context
    if (context) {
      try {
        const parsed = (await context.clone().json()) as { message?: string; error?: string }
        throw new Error(parsed.message || parsed.error || error.message)
      } catch {
        // corpo não era JSON — segue com a mensagem genérica do supabase-js
      }
    }
    throw new Error(error.message)
  }
  return data as GeminiResponse
}
