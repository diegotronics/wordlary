import { calculateSM2, type SM2Input } from './sm2'
import { MIN_EASE_FACTOR } from '@/lib/constants'

// Fix time so date assertions are deterministic
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-15T14:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

function makeInput(overrides: Partial<SM2Input> = {}): SM2Input {
  return {
    quality: 4,
    repetitionNumber: 0,
    easeFactor: 2.5,
    intervalDays: 1,
    ...overrides,
  }
}

describe('calculateSM2', () => {
  // -------------------------------------------------------------------
  // Quality < 4 — resets progress
  // -------------------------------------------------------------------
  describe('quality < 4 (Again / Hard)', () => {
    it('quality=0 resets repetitionNumber to 0 and intervalDays to 1', () => {
      const result = calculateSM2(makeInput({ quality: 0, repetitionNumber: 5, intervalDays: 30 }))
      expect(result.repetitionNumber).toBe(0)
      expect(result.intervalDays).toBe(1)
    })

    it('quality=1 resets repetitionNumber to 0 and intervalDays to 1', () => {
      const result = calculateSM2(makeInput({ quality: 1, repetitionNumber: 3, intervalDays: 15 }))
      expect(result.repetitionNumber).toBe(0)
      expect(result.intervalDays).toBe(1)
    })

    it('quality=0 resets even with high repetitionNumber', () => {
      const result = calculateSM2(makeInput({ quality: 0, repetitionNumber: 100, intervalDays: 365 }))
      expect(result.repetitionNumber).toBe(0)
      expect(result.intervalDays).toBe(1)
    })
  })

  // -------------------------------------------------------------------
  // Quality >= 4 — advances schedule
  // -------------------------------------------------------------------
  describe('quality >= 4 (Good / Easy)', () => {
    it('repetitionNumber=0: intervalDays=1 (first review)', () => {
      const result = calculateSM2(makeInput({ quality: 4, repetitionNumber: 0 }))
      expect(result.intervalDays).toBe(1)
      expect(result.repetitionNumber).toBe(1)
    })

    it('repetitionNumber=1: intervalDays=6 (second review)', () => {
      const result = calculateSM2(makeInput({ quality: 4, repetitionNumber: 1 }))
      expect(result.intervalDays).toBe(6)
      expect(result.repetitionNumber).toBe(2)
    })

    it('repetitionNumber=2: intervalDays = round(interval * EF)', () => {
      const result = calculateSM2(
        makeInput({ quality: 4, repetitionNumber: 2, easeFactor: 2.5, intervalDays: 6 })
      )
      expect(result.intervalDays).toBe(Math.round(6 * 2.5)) // 15
      expect(result.repetitionNumber).toBe(3)
    })

    it('repetitionNumber=3 with quality=5: larger interval due to higher EF', () => {
      const result = calculateSM2(
        makeInput({ quality: 5, repetitionNumber: 3, easeFactor: 2.6, intervalDays: 15 })
      )
      expect(result.intervalDays).toBe(Math.round(15 * 2.6)) // 39
      expect(result.repetitionNumber).toBe(4)
    })

    it('increments repetitionNumber by 1', () => {
      const result = calculateSM2(makeInput({ quality: 5, repetitionNumber: 7 }))
      expect(result.repetitionNumber).toBe(8)
    })
  })

  // -------------------------------------------------------------------
  // Ease factor formula: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  // -------------------------------------------------------------------
  describe('ease factor calculation', () => {
    it('quality=5: ease factor increases by 0.1', () => {
      const result = calculateSM2(makeInput({ quality: 5, easeFactor: 2.5 }))
      expect(result.easeFactor).toBeCloseTo(2.6)
    })

    it('quality=4: ease factor stays the same', () => {
      // EF + (0.1 - 1*(0.08 + 1*0.02)) = EF + (0.1 - 0.1) = EF
      const result = calculateSM2(makeInput({ quality: 4, easeFactor: 2.5 }))
      expect(result.easeFactor).toBeCloseTo(2.5)
    })

    it('quality=1: ease factor decreases by 0.54', () => {
      // EF + (0.1 - 4*(0.08 + 4*0.02)) = EF + (0.1 - 0.64) = EF - 0.54
      const result = calculateSM2(makeInput({ quality: 1, easeFactor: 2.5 }))
      expect(result.easeFactor).toBeCloseTo(1.96)
    })

    it('quality=0: ease factor decreases by 0.8', () => {
      // EF + (0.1 - 5*(0.08 + 5*0.02)) = EF + (0.1 - 0.9) = EF - 0.8
      const result = calculateSM2(makeInput({ quality: 0, easeFactor: 2.5 }))
      expect(result.easeFactor).toBeCloseTo(1.7)
    })

    it('never goes below MIN_EASE_FACTOR (1.3)', () => {
      const result = calculateSM2(makeInput({ quality: 0, easeFactor: 1.3 }))
      expect(result.easeFactor).toBe(MIN_EASE_FACTOR)
    })

    it('stays at MIN_EASE_FACTOR if already at minimum with quality=0', () => {
      const result = calculateSM2(makeInput({ quality: 0, easeFactor: MIN_EASE_FACTOR }))
      expect(result.easeFactor).toBe(MIN_EASE_FACTOR)
    })

    it('low ease factor with quality=1 clamps to MIN_EASE_FACTOR', () => {
      // 1.3 + (0.1 - 0.64) = 1.3 - 0.54 = 0.76 → clamp to 1.3
      const result = calculateSM2(makeInput({ quality: 1, easeFactor: 1.3 }))
      expect(result.easeFactor).toBe(MIN_EASE_FACTOR)
    })
  })

  // -------------------------------------------------------------------
  // Next review date
  // -------------------------------------------------------------------
  describe('next review date', () => {
    it('returns a valid YYYY-MM-DD date string', () => {
      const result = calculateSM2(makeInput())
      expect(result.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('date is offset by intervalDays from today', () => {
      // quality=4, rep=1 → intervalDays=6, so next review = 2026-03-21
      const result = calculateSM2(makeInput({ quality: 4, repetitionNumber: 1 }))
      expect(result.intervalDays).toBe(6)
      expect(result.nextReviewDate).toBe('2026-03-21')
    })

    it('quality=0 resets to intervalDays=1 → tomorrow', () => {
      const result = calculateSM2(makeInput({ quality: 0 }))
      expect(result.nextReviewDate).toBe('2026-03-16')
    })
  })
})
