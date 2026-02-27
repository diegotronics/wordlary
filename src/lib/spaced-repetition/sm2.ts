// ============================================================================
// VocabFlow - SM-2 Spaced Repetition Algorithm
// Based on the SuperMemo SM-2 algorithm by Piotr Wozniak
// ============================================================================

import { MIN_EASE_FACTOR } from '@/lib/constants';
import type { ReviewQuality } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SM2Input {
  /** Review quality: 0 (Again), 1 (Hard), 3 (Good), 5 (Easy) */
  quality: ReviewQuality;
  /** Current repetition count (0 = never successfully reviewed) */
  repetitionNumber: number;
  /** Current ease factor (default 2.5 for new cards) */
  easeFactor: number;
  /** Current interval in days before the next review */
  intervalDays: number;
}

export interface SM2Output {
  /** Updated repetition count */
  repetitionNumber: number;
  /** Updated ease factor (minimum 1.3) */
  easeFactor: number;
  /** Updated interval in days until next review */
  intervalDays: number;
  /** ISO date string for the next scheduled review */
  nextReviewDate: string;
}

// ---------------------------------------------------------------------------
// Algorithm
// ---------------------------------------------------------------------------

/**
 * Calculates the next review schedule using the SM-2 algorithm.
 *
 * Quality ratings:
 *   0 = Again  (complete blackout, no recognition)
 *   1 = Hard   (incorrect but upon seeing the answer it felt familiar)
 *   3 = Good   (correct with some difficulty)
 *   5 = Easy   (perfect, immediate recall)
 *
 * @param input - Current card state and review quality
 * @returns Updated card state with next review date
 */
export function calculateSM2(input: SM2Input): SM2Output {
  const { quality, repetitionNumber, easeFactor, intervalDays } = input;

  let newRepetitionNumber: number;
  let newIntervalDays: number;

  if (quality < 3) {
    // Again (0) or Hard (1): reset progress
    newRepetitionNumber = 0;
    newIntervalDays = 1;
  } else {
    // Good (3) or Easy (5): advance through the schedule
    if (repetitionNumber === 0) {
      newIntervalDays = 1;
    } else if (repetitionNumber === 1) {
      newIntervalDays = 6;
    } else {
      newIntervalDays = Math.round(intervalDays * easeFactor);
    }
    newRepetitionNumber = repetitionNumber + 1;
  }

  // Update ease factor using SM-2 formula:
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const q = quality;
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  // Calculate the next review date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextReview = new Date(today);
  nextReview.setDate(nextReview.getDate() + newIntervalDays);
  const nextReviewDate = nextReview.toISOString().split('T')[0];

  return {
    repetitionNumber: newRepetitionNumber,
    easeFactor: newEaseFactor,
    intervalDays: newIntervalDays,
    nextReviewDate,
  };
}
