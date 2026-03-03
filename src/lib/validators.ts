// ============================================================================
// Wordlary - Zod Validation Schemas
// ============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Gemini AI Generated Word Schema
// ---------------------------------------------------------------------------
export const generatedWordSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().min(1),
  example_sentence: z.string().min(1),
  word_es: z.string().min(1),
  sentence_es: z.string().min(1),
  interest_slug: z.string().min(1),
});

export const generatedWordsSchema = z.array(generatedWordSchema);

// ---------------------------------------------------------------------------
// Interest Selection Schema (Onboarding)
// ---------------------------------------------------------------------------
export const interestSelectionSchema = z
  .array(z.string().uuid())
  .min(3, "Select at least 3 interests")
  .max(6, "Select at most 6 interests");

// ---------------------------------------------------------------------------
// Review Submission Schema (Spaced Repetition)
// ---------------------------------------------------------------------------
export const reviewSubmissionSchema = z.object({
  word_id: z.string().uuid(),
  quality: z
    .number()
    .refine(
      (val): val is 0 | 1 | 3 | 5 => [0, 1, 3, 5].includes(val),
      { message: "Quality must be 0 (Again), 1 (Hard), 3 (Good), or 5 (Easy)" }
    ),
});

// ---------------------------------------------------------------------------
// Profile Update Schema
// ---------------------------------------------------------------------------
export const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  daily_word_count: z.number().int().min(5).max(20).optional(),
  preferred_difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .optional(),
});
