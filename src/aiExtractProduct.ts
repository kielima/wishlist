// Lê nome e preço de um produto a partir de uma foto (ex: print de tela de
// uma loja que bloqueia a extração automática por link, como o Mercado
// Livre). Mesmo desenho de src/lib/aiTranscribe.ts no app-produtividade,
// adaptado pra extrair campos estruturados de produto em vez de texto livre.
import { callGemini } from './geminiClient'

const MODEL = 'gemini-2.5-flash'

export class AiExtractError extends Error {}

export interface ExtractedProduct {
  name: string
  /** Preço em reais, arredondado, como string de dígitos — mesmo formato do campo Preço do formulário. */
  priceReais: string | null
}

const PROMPT = [
  'Você é um assistente que lê capturas de tela de páginas de produto de lojas online.',
  'Analise a imagem e devolva um JSON com:',
  '- "name": o nome do produto, sem o nome da loja nem textos de propaganda;',
  '- "price": o preço à vista do produto em reais, como número (ex: 189.9), sem o símbolo R$ — use o valor à vista/principal, não o valor de uma parcela. null se não houver preço visível.',
  'Responda em português do Brasil.',
].join('\n')

export async function extractProductFromImage(args: { imageBase64: string; mimeType: string }): Promise<ExtractedProduct> {
  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: args.mimeType, data: args.imageBase64 } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number', nullable: true },
        },
        required: ['name', 'price'],
      },
    },
  }

  let json: Awaited<ReturnType<typeof callGemini>>
  try {
    json = await callGemini(MODEL, body)
  } catch (e) {
    throw new AiExtractError(e instanceof Error ? e.message : String(e))
  }

  if (json.promptFeedback?.blockReason) {
    throw new AiExtractError(`Prompt bloqueado: ${json.promptFeedback.blockReason}`)
  }

  const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!responseText) throw new AiExtractError('Resposta do Gemini sem conteúdo.')

  let parsed: { name?: unknown; price?: unknown }
  try {
    parsed = JSON.parse(responseText)
  } catch {
    throw new AiExtractError('JSON inválido na resposta do Gemini.')
  }

  const name = typeof parsed.name === 'string' ? parsed.name.trim() : ''
  const price = typeof parsed.price === 'number' && Number.isFinite(parsed.price) ? parsed.price : null

  return { name, priceReais: price != null ? String(Math.round(price)) : null }
}

/** Separa uma data URL ("data:image/jpeg;base64,...") em mime type e base64 cru. */
export function splitDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!m) return null
  return { mimeType: m[1], base64: m[2] }
}
