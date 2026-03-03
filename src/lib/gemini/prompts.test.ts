import { buildWordGenerationPrompt } from './prompts'

describe('buildWordGenerationPrompt', () => {
  const defaultInterests = ['technology', 'cooking']
  const defaultExisting = ['hello', 'world']

  it('includes all interest names in the prompt', () => {
    const prompt = buildWordGenerationPrompt(defaultInterests, [], 5, 'beginner')
    expect(prompt).toContain('technology')
    expect(prompt).toContain('cooking')
  })

  it('includes the correct word count', () => {
    const prompt = buildWordGenerationPrompt(defaultInterests, [], 10, 'beginner')
    expect(prompt).toContain('exactly 10')
  })

  it('includes exclusion block when existingWords is non-empty', () => {
    const prompt = buildWordGenerationPrompt(defaultInterests, defaultExisting, 5, 'beginner')
    expect(prompt).toContain('Do NOT include any of the following words')
    expect(prompt).toContain('hello')
    expect(prompt).toContain('world')
  })

  it('omits exclusion block when existingWords is empty', () => {
    const prompt = buildWordGenerationPrompt(defaultInterests, [], 5, 'beginner')
    expect(prompt).not.toContain('Do NOT include any of the following words')
  })

  it('beginner difficulty includes beginner-specific description', () => {
    const prompt = buildWordGenerationPrompt(defaultInterests, [], 5, 'beginner')
    expect(prompt).toContain('common, everyday vocabulary')
  })

  it('intermediate difficulty includes intermediate-specific description', () => {
    const prompt = buildWordGenerationPrompt(defaultInterests, [], 5, 'intermediate')
    expect(prompt).toContain('academic and professional-level')
  })

  it('advanced difficulty includes advanced-specific description', () => {
    const prompt = buildWordGenerationPrompt(defaultInterests, [], 5, 'advanced')
    expect(prompt).toContain('sophisticated and specialized')
  })

  it('unknown difficulty falls back to intermediate-level description', () => {
    const prompt = buildWordGenerationPrompt(defaultInterests, [], 5, 'unknown_level')
    expect(prompt).toContain('appropriate for an intermediate English learner')
  })

  it('includes JSON format example', () => {
    const prompt = buildWordGenerationPrompt(defaultInterests, [], 5, 'beginner')
    expect(prompt).toContain('"word"')
    expect(prompt).toContain('"ipa"')
    expect(prompt).toContain('"example_sentence"')
    expect(prompt).toContain('"word_es"')
    expect(prompt).toContain('"sentence_es"')
    expect(prompt).toContain('"interest_slug"')
  })

  it('returns a non-empty string', () => {
    const prompt = buildWordGenerationPrompt([], [], 1, 'beginner')
    expect(prompt.length).toBeGreaterThan(0)
  })
})
