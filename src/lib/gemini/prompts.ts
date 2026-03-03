// ============================================================================
// Wordlary - Gemini Prompt Builder
// ============================================================================

/**
 * Builds a prompt for Gemini to generate English vocabulary words
 * tailored for Spanish-speaking learners based on their interests.
 *
 * @param interests  - Array of interest slugs (e.g. ["technology", "cooking"])
 * @param existingWords - Words the user already knows (to be excluded)
 * @param count - Number of words to generate
 * @param difficulty - beginner | intermediate | advanced
 * @returns Formatted prompt string for the Gemini model
 */
export function buildWordGenerationPrompt(
  interests: string[],
  existingWords: string[],
  count: number,
  difficulty: string,
): string {
  const interestList = interests.join(', ');

  const exclusionBlock =
    existingWords.length > 0
      ? `\nIMPORTANT: Do NOT include any of the following words (the user already knows them):\n[${existingWords.join(', ')}]\n`
      : '';

  const difficultyDescription = getDifficultyDescription(difficulty);

  return `You are an English vocabulary tutor for native Spanish speakers.

Generate exactly ${count} English vocabulary items related to the following interest areas: ${interestList}.

IMPORTANT — Vocabulary variety: Do NOT only generate single nouns. Include a diverse mix of vocabulary types such as:
- Verbs (e.g., "to allocate", "to brainstorm")
- Phrasal verbs (e.g., "look up", "run out of")
- Adjectives (e.g., "overwhelming", "subtle")
- Adverbs (e.g., "thoroughly", "barely")
- Compound words (e.g., "breakdown", "feedback")
- Modal expressions (e.g., "ought to", "might as well")
- Common nouns and abstract nouns
Aim for at least 3-4 different vocabulary types across the ${count} items.

Difficulty level: ${difficulty}
${difficultyDescription}
${exclusionBlock}
For each item, provide:
- "word": the English vocabulary item (for phrasal verbs or multi-word expressions, include the full phrase)
- "ipa": the IPA (International Phonetic Alphabet) pronunciation notation
- "example_sentence": a short, natural example sentence (8-12 words max) that clearly shows the meaning
- "word_es": the Spanish translation
- "sentence_es": the Spanish translation of the example sentence
- "interest_slug": the interest area this item belongs to (must be exactly one of: ${interestList})

Respond with a JSON array of objects. Each object must have exactly these six fields.

Example format:
[
  {
    "word": "look up",
    "ipa": "/l\u028Ak \u028Cp/",
    "example_sentence": "I need to look up that recipe online.",
    "word_es": "buscar",
    "sentence_es": "Necesito buscar esa receta en l\u00EDnea.",
    "interest_slug": "cooking"
  }
]

Rules:
- Generate exactly ${count} items.
- Distribute items across the provided interest areas as evenly as possible.
- Each interest_slug must match one of the provided interest slugs exactly.
- Keep example sentences short (8-12 words) — they must fit on a mobile card.
- Every example sentence must sound natural and clearly demonstrate the meaning.
- IPA notation must be accurate and enclosed in slashes.
- Spanish translations must be accurate and natural-sounding.
- Do not repeat any words or expressions.`;
}

/**
 * Returns a human-readable description of what each difficulty level means
 * for word selection.
 */
function getDifficultyDescription(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'Word complexity: Choose common, everyday vocabulary that a beginning English learner would encounter in daily life. These should be high-frequency, practical items — including basic verbs, simple adjectives, and essential phrases.';
    case 'intermediate':
      return 'Word complexity: Choose academic and professional-level vocabulary. Include phrasal verbs, compound words, and expressions commonly found in news articles, workplace communication, and educational contexts.';
    case 'advanced':
      return 'Word complexity: Choose sophisticated and specialized vocabulary. Include nuanced phrasal verbs, idiomatic expressions, and precise terms used in formal writing, technical fields, or literary contexts.';
    default:
      return 'Word complexity: Choose vocabulary appropriate for an intermediate English learner.';
  }
}
