import { describe, it, expect } from 'vitest'
import { formatDate, truncate } from '../../../app/utils/formatters.js'

describe('formatDate', () => {
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatDate('')).toBe('')
  })

  it('returns empty string for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('')
  })

  it('returns empty string for a purely numeric non-date string', () => {
    expect(formatDate('abc123xyz')).toBe('')
  })

  it('formats a valid ISO date string to en-US long format', () => {
    const result = formatDate('2024-01-15')
    expect(result).toBe('January 15, 2024')
  })

  it('formats January 1st correctly', () => {
    const result = formatDate('2020-01-01')
    expect(result).toBe('January 1, 2020')
  })

  it('formats December 31st correctly', () => {
    const result = formatDate('2023-12-31')
    expect(result).toBe('December 31, 2023')
  })

  it('formats a date with full month name', () => {
    const result = formatDate('2022-07-04')
    expect(result).toContain('July')
    expect(result).toContain('2022')
    expect(result).toContain('4')
  })

  it('includes year in formatted output', () => {
    const result = formatDate('2019-06-15')
    expect(result).toContain('2019')
  })

  it('includes numeric day in formatted output', () => {
    const result = formatDate('2024-03-05')
    expect(result).toContain('5')
  })

  it('handles datetime strings with time portion', () => {
    const result = formatDate('2024-06-10T14:30:00Z')
    expect(result).toContain('2024')
    expect(result).not.toBe('')
  })

  it('handles timestamp strings parsed as dates', () => {
    const result = formatDate('2021-11-22T00:00:00.000Z')
    expect(result).toContain('2021')
  })

  it('returns month as written word, not a number', () => {
    const result = formatDate('2024-02-14')
    expect(result).toMatch(/February/)
  })

  it('format is consistent for the same input', () => {
    const a = formatDate('2024-05-01')
    const b = formatDate('2024-05-01')
    expect(a).toBe(b)
  })
})

describe('truncate', () => {
  it('returns empty string for null', () => {
    expect(truncate(null, 100)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(truncate(undefined, 100)).toBe('')
  })

  it('returns empty string for empty string input', () => {
    expect(truncate('', 100)).toBe('')
  })

  it('returns full text when shorter than length', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
  })

  it('returns full text when exactly equal to length', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })

  it('truncates and appends ellipsis when text exceeds length', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...')
  })

  it('truncates to the exact character limit before appending ellipsis', () => {
    const result = truncate('ABCDEFGHIJ', 6)
    expect(result).toBe('ABCDEF...')
  })

  it('works with length of 1', () => {
    expect(truncate('Hello', 1)).toBe('H...')
  })

  it('works with a long text and large length', () => {
    const text = 'a'.repeat(500)
    const result = truncate(text, 200)
    expect(result).toBe('a'.repeat(200) + '...')
  })

  it('does not add ellipsis when text fits exactly', () => {
    const text = 'abc'
    expect(truncate(text, 3)).toBe('abc')
    expect(truncate(text, 3)).not.toContain('...')
  })

  it('handles single character text within limit', () => {
    expect(truncate('A', 5)).toBe('A')
  })

  it('handles single character text at limit', () => {
    expect(truncate('A', 1)).toBe('A')
  })

  it('handles text with spaces correctly', () => {
    const result = truncate('Hello World Test', 11)
    expect(result).toBe('Hello World...')
  })

  it('handles numeric-like string content', () => {
    expect(truncate('12345678', 5)).toBe('12345...')
  })
})
