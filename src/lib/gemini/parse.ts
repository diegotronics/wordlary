// ============================================================================
// Wordlary - Gemini Response Parser
// ============================================================================

import { generatedWordsSchema } from '@/lib/validators';
import type { GeneratedWord } from '@/lib/types';

interface ParseSuccess {
  success: true;
  words: GeneratedWord[];
}

interface ParseFailure {
  success: false;
  error: string;
}

type ParseResult = ParseSuccess | ParseFailure;

/**
 * Parses and validates a raw Gemini response text into an array of
 * generated vocabulary words.
 *
 * @param responseText - The raw JSON string returned by the Gemini model
 * @returns A discriminated union: { success: true, words } or { success: false, error }
 */
export function parseGeminiResponse(responseText: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    return {
      success: false,
      error: `Failed to parse Gemini response as JSON: ${responseText.slice(0, 200)}`,
    };
  }

  const result = generatedWordsSchema.safeParse(parsed);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    return {
      success: false,
      error: `Gemini response failed validation:\n${formattedErrors}`,
    };
  }

  return {
    success: true,
    words: result.data,
  };
}
