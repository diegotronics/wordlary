import { getUserToday, getUserTomorrow, getUserYesterday, getFutureDate } from './date'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-15T14:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('getUserToday', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(getUserToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('defaults to UTC when timezone is undefined', () => {
    expect(getUserToday()).toBe('2026-03-15')
  })

  it('defaults to UTC when timezone is null', () => {
    expect(getUserToday(null)).toBe('2026-03-15')
  })

  it('handles valid IANA timezone', () => {
    // 14:00 UTC = 07:00 in LA (PDT), still March 15
    expect(getUserToday('America/Los_Angeles')).toBe('2026-03-15')
  })

  it('falls back to UTC for invalid timezone string', () => {
    expect(getUserToday('Invalid/Timezone')).toBe('2026-03-15')
  })

  it('respects timezone that crosses date boundary', () => {
    // Set time to 2026-03-15 02:00 UTC → in Asia/Tokyo (UTC+9) it's 11:00 March 15
    // but at 23:00 UTC it would be March 16 in Tokyo
    vi.setSystemTime(new Date('2026-03-15T23:00:00Z'))
    expect(getUserToday('Asia/Tokyo')).toBe('2026-03-16')
  })
})

describe('getUserTomorrow', () => {
  it('returns date one day after today', () => {
    expect(getUserTomorrow()).toBe('2026-03-16')
  })

  it('handles month boundary', () => {
    vi.setSystemTime(new Date('2026-03-31T14:00:00Z'))
    expect(getUserTomorrow()).toBe('2026-04-01')
  })

  it('handles year boundary', () => {
    vi.setSystemTime(new Date('2026-12-31T14:00:00Z'))
    expect(getUserTomorrow()).toBe('2027-01-01')
  })
})

describe('getUserYesterday', () => {
  it('returns date one day before today', () => {
    expect(getUserYesterday()).toBe('2026-03-14')
  })

  it('handles month boundary', () => {
    vi.setSystemTime(new Date('2026-04-01T14:00:00Z'))
    expect(getUserYesterday()).toBe('2026-03-31')
  })
})

describe('getFutureDate', () => {
  it('getFutureDate(0) returns today', () => {
    expect(getFutureDate(0)).toBe('2026-03-15')
  })

  it('getFutureDate(1) returns tomorrow', () => {
    expect(getFutureDate(1)).toBe('2026-03-16')
  })

  it('getFutureDate(6) returns 6 days ahead', () => {
    expect(getFutureDate(6)).toBe('2026-03-21')
  })

  it('getFutureDate(30) crosses month boundary', () => {
    expect(getFutureDate(30)).toBe('2026-04-14')
  })

  it('handles negative days (past)', () => {
    expect(getFutureDate(-1)).toBe('2026-03-14')
  })

  it('handles large offsets (365 days)', () => {
    expect(getFutureDate(365)).toBe('2027-03-15')
  })

  it('respects timezone parameter', () => {
    expect(getFutureDate(1, 'America/New_York')).toBe('2026-03-16')
  })
})
