import { describe, expect, it } from 'vitest'
import { effectiveMode, emptySaved } from './ahpStore'

describe('effectiveMode', () => {
  it('usa pares até 7 itens e notas a partir de 8', () => {
    const s = emptySaved()
    expect(effectiveMode(s, 2)).toBe('pares')
    expect(effectiveMode(s, 7)).toBe('pares')
    expect(effectiveMode(s, 8)).toBe('notas')
    expect(effectiveMode(s, 30)).toBe('notas')
  })

  it('respeita a escolha salva, qualquer que seja o número de itens', () => {
    expect(effectiveMode({ ...emptySaved(), itemMode: 'notas' }, 3)).toBe('notas')
    expect(effectiveMode({ ...emptySaved(), itemMode: 'pares' }, 12)).toBe('pares')
  })
})
