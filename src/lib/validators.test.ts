import {
  generatedWordSchema,
  generatedWordsSchema,
  interestSelectionSchema,
  reviewSubmissionSchema,
  profileUpdateSchema,
} from './validators'

function validWord() {
  return {
    word: 'allocate',
    ipa: '/ˈæl.ə.keɪt/',
    example_sentence: 'We need to allocate more resources.',
    word_es: 'asignar',
    sentence_es: 'Necesitamos asignar más recursos.',
    interest_slug: 'technology',
  }
}

const validUUID = '550e8400-e29b-41d4-a716-446655440000'

describe('generatedWordSchema', () => {
  it('passes with all valid fields', () => {
    expect(generatedWordSchema.safeParse(validWord()).success).toBe(true)
  })

  it('fails when word is missing', () => {
    const { word: _word, ...rest } = validWord()
    expect(generatedWordSchema.safeParse(rest).success).toBe(false)
  })

  it('fails when word is empty string', () => {
    expect(generatedWordSchema.safeParse({ ...validWord(), word: '' }).success).toBe(false)
  })

  it('fails when ipa is missing', () => {
    const { ipa: _ipa, ...rest } = validWord()
    expect(generatedWordSchema.safeParse(rest).success).toBe(false)
  })

  it('fails when example_sentence is empty', () => {
    expect(generatedWordSchema.safeParse({ ...validWord(), example_sentence: '' }).success).toBe(false)
  })
})

describe('generatedWordsSchema', () => {
  it('passes with valid array', () => {
    expect(generatedWordsSchema.safeParse([validWord()]).success).toBe(true)
  })

  it('passes with empty array', () => {
    expect(generatedWordsSchema.safeParse([]).success).toBe(true)
  })

  it('fails with non-array', () => {
    expect(generatedWordsSchema.safeParse(validWord()).success).toBe(false)
  })

  it('fails when array contains invalid word', () => {
    expect(generatedWordsSchema.safeParse([{ word: '' }]).success).toBe(false)
  })
})

describe('interestSelectionSchema', () => {
  it('passes with 3 valid UUIDs', () => {
    const ids = [validUUID, validUUID.replace('0000', '0001'), validUUID.replace('0000', '0002')]
    expect(interestSelectionSchema.safeParse(ids).success).toBe(true)
  })

  it('passes with 6 valid UUIDs', () => {
    const ids = Array.from({ length: 6 }, (_, i) => validUUID.replace('0000', `000${i}`))
    expect(interestSelectionSchema.safeParse(ids).success).toBe(true)
  })

  it('fails with 2 UUIDs (min is 3)', () => {
    const ids = [validUUID, validUUID.replace('0000', '0001')]
    const result = interestSelectionSchema.safeParse(ids)
    expect(result.success).toBe(false)
  })

  it('fails with 7 UUIDs (max is 6)', () => {
    const ids = Array.from({ length: 7 }, (_, i) => validUUID.replace('0000', `000${i}`))
    const result = interestSelectionSchema.safeParse(ids)
    expect(result.success).toBe(false)
  })

  it('fails with non-UUID strings', () => {
    expect(interestSelectionSchema.safeParse(['not-a-uuid', 'also-not', 'nope']).success).toBe(false)
  })

  it('fails with empty array', () => {
    expect(interestSelectionSchema.safeParse([]).success).toBe(false)
  })
})

describe('reviewSubmissionSchema', () => {
  it('passes with quality=0 (Again)', () => {
    expect(reviewSubmissionSchema.safeParse({ word_id: validUUID, quality: 0 }).success).toBe(true)
  })

  it('passes with quality=1 (Hard)', () => {
    expect(reviewSubmissionSchema.safeParse({ word_id: validUUID, quality: 1 }).success).toBe(true)
  })

  it('passes with quality=4 (Good)', () => {
    expect(reviewSubmissionSchema.safeParse({ word_id: validUUID, quality: 4 }).success).toBe(true)
  })

  it('passes with quality=5 (Easy)', () => {
    expect(reviewSubmissionSchema.safeParse({ word_id: validUUID, quality: 5 }).success).toBe(true)
  })

  it('fails with quality=2 (not a valid rating)', () => {
    expect(reviewSubmissionSchema.safeParse({ word_id: validUUID, quality: 2 }).success).toBe(false)
  })

  it('fails with quality=3 (not a valid rating)', () => {
    expect(reviewSubmissionSchema.safeParse({ word_id: validUUID, quality: 3 }).success).toBe(false)
  })

  it('fails when word_id is missing', () => {
    expect(reviewSubmissionSchema.safeParse({ quality: 4 }).success).toBe(false)
  })

  it('fails when word_id is not a UUID', () => {
    expect(reviewSubmissionSchema.safeParse({ word_id: 'not-uuid', quality: 4 }).success).toBe(false)
  })
})

describe('profileUpdateSchema', () => {
  it('passes with empty object (all optional)', () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('passes with valid display_name', () => {
    expect(profileUpdateSchema.safeParse({ display_name: 'Juan' }).success).toBe(true)
  })

  it('fails when display_name exceeds 100 chars', () => {
    expect(profileUpdateSchema.safeParse({ display_name: 'a'.repeat(101) }).success).toBe(false)
  })

  it('fails when display_name is empty string', () => {
    expect(profileUpdateSchema.safeParse({ display_name: '' }).success).toBe(false)
  })

  it('passes with daily_word_count=5 (min)', () => {
    expect(profileUpdateSchema.safeParse({ daily_word_count: 5 }).success).toBe(true)
  })

  it('passes with daily_word_count=20 (max)', () => {
    expect(profileUpdateSchema.safeParse({ daily_word_count: 20 }).success).toBe(true)
  })

  it('fails with daily_word_count=4 (below min)', () => {
    expect(profileUpdateSchema.safeParse({ daily_word_count: 4 }).success).toBe(false)
  })

  it('fails with daily_word_count=21 (above max)', () => {
    expect(profileUpdateSchema.safeParse({ daily_word_count: 21 }).success).toBe(false)
  })

  it('passes with preferred_difficulty=beginner', () => {
    expect(profileUpdateSchema.safeParse({ preferred_difficulty: 'beginner' }).success).toBe(true)
  })

  it('fails with unknown difficulty', () => {
    expect(profileUpdateSchema.safeParse({ preferred_difficulty: 'expert' }).success).toBe(false)
  })
})
