import { describe, it, expect } from 'vitest'
import { calculateHotFiles, parsePeriod, getRiskLevel } from '../git/analyzer'

// ─── parsePeriod ──────────────────────────────────────────────────────────────

describe('parsePeriod', () => {
  it('converts days correctly', () => {
    expect(parsePeriod('7d')).toBe('7 days ago')
    expect(parsePeriod('30d')).toBe('30 days ago')
    expect(parsePeriod('1d')).toBe('1 days ago')
  })

  it('converts weeks correctly', () => {
    expect(parsePeriod('2w')).toBe('2 weeks ago')
    expect(parsePeriod('12w')).toBe('12 weeks ago')
  })

  it('converts months correctly', () => {
    expect(parsePeriod('3m')).toBe('3 months ago')
    expect(parsePeriod('6m')).toBe('6 months ago')
  })

  it('converts years correctly', () => {
    expect(parsePeriod('1y')).toBe('1 years ago')
  })

  it('passes through a raw ISO date', () => {
    expect(parsePeriod('2024-01-01')).toBe('2024-01-01')
  })

  it('returns default for unknown format', () => {
    expect(parsePeriod('bad-input')).toBe('30 days ago')
    expect(parsePeriod('')).toBe('30 days ago')
  })
})

// ─── getRiskLevel ─────────────────────────────────────────────────────────────

describe('getRiskLevel', () => {
  it('returns HIGH for > 30 changes', () => {
    expect(getRiskLevel(31)).toBe('HIGH')
    expect(getRiskLevel(100)).toBe('HIGH')
  })

  it('returns MED for 16–30 changes', () => {
    expect(getRiskLevel(30)).toBe('MED')
    expect(getRiskLevel(16)).toBe('MED')
  })

  it('returns LOW for <= 15 changes', () => {
    expect(getRiskLevel(15)).toBe('LOW')
    expect(getRiskLevel(1)).toBe('LOW')
    expect(getRiskLevel(0)).toBe('LOW')
  })
})

// ─── calculateHotFiles ────────────────────────────────────────────────────────

describe('calculateHotFiles', () => {
  it('sorts files by change count descending', () => {
    const mockLines = [
      'src/editor.ts',
      'src/editor.ts',
      'src/editor.ts',
      'src/auth.ts',
      'src/auth.ts',
      'README.md',
    ]
    const result = calculateHotFiles(mockLines)
    expect(result[0].file).toBe('src/editor.ts')
    expect(result[0].changeCount).toBe(3)
    expect(result[1].file).toBe('src/auth.ts')
    expect(result[1].changeCount).toBe(2)
  })

  it('returns max 20 files', () => {
    const mockLines = Array.from({ length: 500 }, (_, i) => `file${i % 100}.ts`)
    const result = calculateHotFiles(mockLines)
    expect(result.length).toBeLessThanOrEqual(20)
  })

  it('filters empty lines', () => {
    const mockLines = ['', '  ', 'src/index.ts', '', 'src/index.ts']
    const result = calculateHotFiles(mockLines)
    expect(result).toHaveLength(1)
    expect(result[0].file).toBe('src/index.ts')
    expect(result[0].changeCount).toBe(2)
  })

  it('assigns correct risk levels', () => {
    // 31 changes → HIGH
    const highLines = Array.from({ length: 31 }, () => 'hot.ts')
    const [highFile] = calculateHotFiles(highLines)
    expect(highFile.riskLevel).toBe('HIGH')

    // 20 changes → MED
    const medLines = Array.from({ length: 20 }, () => 'med.ts')
    const [medFile] = calculateHotFiles(medLines)
    expect(medFile.riskLevel).toBe('MED')

    // 5 changes → LOW
    const lowLines = Array.from({ length: 5 }, () => 'low.ts')
    const [lowFile] = calculateHotFiles(lowLines)
    expect(lowFile.riskLevel).toBe('LOW')
  })

  it('returns empty array for empty input', () => {
    expect(calculateHotFiles([])).toHaveLength(0)
    expect(calculateHotFiles(['', '  '])).toHaveLength(0)
  })
})
