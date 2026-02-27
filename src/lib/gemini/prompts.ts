// ============================================================================
// VocabFlow - Gemini Prompt Builder
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

Generate exactly ${count} English vocabulary words that are related to the following interest areas: ${interestList}.

Difficulty level: ${difficulty}
${difficultyDescription}
${exclusionBlock}
For each word, provide:
- "word": the English vocabulary word
- "ipa": the IPA (International Phonetic Alphabet) pronunciation notation for the word
- "example_sentence": a natural, illustrative example sentence in English using the word
- "word_es": the Spanish translation of the word
- "sentence_es": the Spanish translation of the example sentence
- "interest_slug": the interest area this word belongs to (must be exactly one of: ${interestList})

Respond with a JSON array of objects. Each object must have exactly these six fields.

Example format:
[
  {
    "word": "algorithm",
    "ipa": "/\u02C8\u00E6l.\u0261\u0259.\u0279\u026A.\u00F0\u0259m/",
    "example_sentence": "The search algorithm efficiently sorts through millions of records.",
    "word_es": "algoritmo",
    "sentence_es": "El algoritmo de b\u00FAsqueda clasifica eficientemente millones de registros.",
    "interest_slug": "technology"
  }
]

Rules:
- Generate exactly ${count} words.
- Distribute words across the provided interest areas as evenly as possible.
- Each interest_slug must match one of the provided interest slugs exactly.
- Every example sentence must sound natural and clearly demonstrate the meaning of the word.
- IPA notation must be accurate and enclosed in slashes.
- Spanish translations must be accurate and natural-sounding.
- Do not repeat any words.`;
}

/**
 * Returns a human-readable description of what each difficulty level means
 * for word selection.
 */
function getDifficultyDescription(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'Word complexity: Choose common, everyday words that a beginning English learner would encounter in daily life. These should be high-frequency, practical words.';
    case 'intermediate':
      return 'Word complexity: Choose academic and professional-level words. These should be words commonly found in news articles, workplace communication, and educational contexts.';
    case 'advanced':
      return 'Word complexity: Choose sophisticated and specialized words. These should be nuanced, precise vocabulary used in formal writing, technical fields, or literary contexts.';
    default:
      return 'Word complexity: Choose words appropriate for an intermediate English learner.';
  }
}
