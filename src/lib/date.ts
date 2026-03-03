// ============================================================================
// VocabFlow - Timezone-Aware Date Utilities
// ============================================================================

/**
 * Formats a Date object as YYYY-MM-DD in the given IANA timezone.
 * Uses sv-SE locale which natively produces ISO-like date format.
 * Falls back to UTC on invalid timezone.
 */
function formatDate(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  }
}

/**
 * Returns today's date (YYYY-MM-DD) in the user's timezone.
 * Falls back to UTC if timezone is null/undefined or invalid.
 */
export function getUserToday(timezone?: string | null): string {
  return formatDate(new Date(), timezone || 'UTC')
}

/**
 * Returns a date offset by N days from today (YYYY-MM-DD) in the user's timezone.
 * Positive = future, negative = past.
 */
function getDateWithOffset(offsetDays: number, timezone?: string | null): string {
  const tz = timezone || 'UTC'
  const todayStr = formatDate(new Date(), tz)
  // Use noon to avoid DST edge cases where midnight might not exist
  const date = new Date(todayStr + 'T12:00:00')
  date.setDate(date.getDate() + offsetDays)
  return formatDate(date, tz)
}

/**
 * Returns tomorrow's date (YYYY-MM-DD) in the user's timezone.
 */
export function getUserTomorrow(timezone?: string | null): string {
  return getDateWithOffset(1, timezone)
}

/**
 * Returns yesterday's date (YYYY-MM-DD) in the user's timezone.
 */
export function getUserYesterday(timezone?: string | null): string {
  return getDateWithOffset(-1, timezone)
}

/**
 * Returns a future date (YYYY-MM-DD) offset by the given number of days
 * from today in the user's timezone. Used by the SM-2 algorithm.
 */
export function getFutureDate(days: number, timezone?: string | null): string {
  return getDateWithOffset(days, timezone)
}
