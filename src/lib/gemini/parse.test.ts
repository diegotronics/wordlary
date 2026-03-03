import { parseGeminiResponse } from './parse'

function validWord(overrides = {}) {
  return {
    word: 'allocate',
    ipa: '/ˈæl.ə.keɪt/',
    example_sentence: 'We need to allocate more resources.',
    word_es: 'asignar',
    sentence_es: 'Necesitamos asignar más recursos.',
    interest_slug: 'technology',
    ...overrides,
  }
}

describe('parseGeminiResponse', () => {
  describe('success cases', () => {
    it('parses valid JSON array with all 6 fields', () => {
      const result = parseGeminiResponse(JSON.stringify([validWord()]))
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.words).toHaveLength(1)
        expect(result.words[0].word).toBe('allocate')
      }
    })

    it('parses single-word array', () => {
      const result = parseGeminiResponse(JSON.stringify([validWord()]))
      expect(result.success).toBe(true)
    })

    it('parses multiple words', () => {
      const words = [
        validWord(),
        validWord({ word: 'brainstorm', word_es: 'lluvia de ideas' }),
      ]
      const result = parseGeminiResponse(JSON.stringify(words))
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.words).toHaveLength(2)
      }
    })

    it('parses empty array as success', () => {
      const result = parseGeminiResponse('[]')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.words).toHaveLength(0)
      }
    })

    it('strips extra fields from valid words', () => {
      const word = { ...validWord(), extra_field: 'should be stripped' }
      const result = parseGeminiResponse(JSON.stringify([word]))
      expect(result.success).toBe(true)
    })
  })

  describe('JSON parse failures', () => {
    it('returns failure for empty string', () => {
      const result = parseGeminiResponse('')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to parse')
      }
    })

    it('returns failure for invalid JSON', () => {
      const result = parseGeminiResponse('not json at all')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to parse')
      }
    })

    it('returns failure for truncated JSON', () => {
      const result = parseGeminiResponse('[{"word": "test"')
      expect(result.success).toBe(false)
    })

    it('truncates raw response to 200 chars in error message', () => {
      const longInput = 'x'.repeat(300)
      const result = parseGeminiResponse(longInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        // The sliced portion should be at most 200 chars
        expect(result.error.length).toBeLessThan(300)
      }
    })
  })

  describe('Zod validation failures', () => {
    it('fails when word field is missing', () => {
      const { word: _word, ...noWord } = validWord()
      const result = parseGeminiResponse(JSON.stringify([noWord]))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('validation')
      }
    })

    it('fails when a required field is empty string', () => {
      const result = parseGeminiResponse(JSON.stringify([validWord({ word: '' })]))
      expect(result.success).toBe(false)
    })

    it('fails when value has wrong type (number instead of string)', () => {
      const result = parseGeminiResponse(JSON.stringify([validWord({ word: 123 })]))
      expect(result.success).toBe(false)
    })

    it('fails when input is an object instead of array', () => {
      const result = parseGeminiResponse(JSON.stringify(validWord()))
      expect(result.success).toBe(false)
    })

    it('fails when ipa is missing', () => {
      const { ipa: _ipa, ...noIpa } = validWord()
      const result = parseGeminiResponse(JSON.stringify([noIpa]))
      expect(result.success).toBe(false)
    })

    it('includes path info in validation error', () => {
      const { word: _word, ...noWord } = validWord()
      const result = parseGeminiResponse(JSON.stringify([noWord]))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('validation')
      }
    })
  })
})
