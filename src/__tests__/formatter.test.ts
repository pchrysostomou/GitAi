import { describe, it, expect, vi } from 'vitest'

// We test the pure UI logic — bar lengths and risk thresholds

// ─── Bar length calculation ───────────────────────────────────────────────────

function calculateBarLength(percentage: number, barWidth = 40): number {
  return Math.round((percentage / 100) * barWidth)
}

describe('calculateBarLength', () => {
  it('calculates full bar for 100%', () => {
    expect(calculateBarLength(100, 40)).toBe(40)
  })

  it('calculates empty bar for 0%', () => {
    expect(calculateBarLength(0, 40)).toBe(0)
  })

  it('calculates half bar for 50%', () => {
    expect(calculateBarLength(50, 40)).toBe(20)
  })

  it('rounds correctly', () => {
    // 33.3% of 40 = 13.32 → rounds to 13
    expect(calculateBarLength(33.3, 40)).toBe(13)
  })
})

// ─── Risk badge text ──────────────────────────────────────────────────────────

function getRiskBadgeText(riskLevel: string): string {
  if (riskLevel === 'HIGH') return 'HIGH'
  if (riskLevel === 'MED') return 'MED'
  return 'LOW'
}

describe('getRiskBadgeText', () => {
  it('returns HIGH for HIGH risk', () => {
    expect(getRiskBadgeText('HIGH')).toBe('HIGH')
  })

  it('returns MED for MED risk', () => {
    expect(getRiskBadgeText('MED')).toBe('MED')
  })

  it('returns LOW for LOW risk', () => {
    expect(getRiskBadgeText('LOW')).toBe('LOW')
  })
})

// ─── Trend chart max ─────────────────────────────────────────────────────────

function getChartMax(commits: number[]): number {
  return Math.max(...commits, 1)
}

describe('getChartMax', () => {
  it('returns 1 as minimum even for zero commits', () => {
    expect(getChartMax([0, 0, 0])).toBe(1)
  })

  it('returns the max commit count', () => {
    expect(getChartMax([5, 12, 3, 8])).toBe(12)
  })
})
