import simpleGit, { SimpleGit, LogResult } from 'simple-git'
import { basename } from 'path'
import type { CommitData, HotFile, DeveloperStat, TrendPoint, RepoInfo } from '../types'

// ─── Period Parser ────────────────────────────────────────────────────────────

/**
 * Converts human-friendly period strings to git --since values.
 * "30d" → "30 days ago", "2w" → "2 weeks ago", "6m" → "6 months ago"
 */
export function parsePeriod(period: string): string {
  const match = period.match(/^(\d+)(d|w|m|y)$/)
  if (!match) {
    // Try as a raw date string (e.g. "2024-01-01")
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return period
    // Default fallback
    return '30 days ago'
  }
  const [, num, unit] = match
  const units: Record<string, string> = {
    d: 'days',
    w: 'weeks',
    m: 'months',
    y: 'years',
  }
  return `${num} ${units[unit]} ago`
}

// ─── Hot Files (pure — easily testable) ──────────────────────────────────────

/**
 * Takes raw lines from `git log --name-only` and returns aggregated file counts.
 */
export function calculateHotFiles(lines: string[]): HotFile[] {
  const fileCounts: Record<string, number> = {}

  lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith(' '))
    .forEach((file) => {
      fileCounts[file] = (fileCounts[file] || 0) + 1
    })

  return Object.entries(fileCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([file, changeCount]) => ({
      file,
      changeCount,
      riskLevel: changeCount > 30 ? 'HIGH' : changeCount > 15 ? 'MED' : 'LOW',
    })) as HotFile[]
}

// ─── Risk Level (pure) ────────────────────────────────────────────────────────

export function getRiskLevel(changeCount: number): 'HIGH' | 'MED' | 'LOW' {
  if (changeCount > 30) return 'HIGH'
  if (changeCount > 15) return 'MED'
  return 'LOW'
}

// ─── GitAnalyzer class ────────────────────────────────────────────────────────

export class GitAnalyzer {
  private git: SimpleGit
  private repoPath: string

  constructor(repoPath: string = process.cwd()) {
    this.repoPath = repoPath
    this.git = simpleGit(repoPath)
  }

  /** Check that the current dir is actually a git repo */
  async validate(): Promise<boolean> {
    try {
      await this.git.status()
      return true
    } catch {
      return false
    }
  }

  /** Get repo metadata */
  async getRepoInfo(): Promise<RepoInfo> {
    const [status, log] = await Promise.all([
      this.git.status(),
      this.git.log({ '--max-count': '1' }),
    ])

    let remoteUrl: string | undefined
    try {
      const remotes = await this.git.getRemotes(true)
      remoteUrl = remotes[0]?.refs?.fetch
    } catch {
      // No remote — local only repo
    }

    let totalCommits = 0
    try {
      const countRaw = await this.git.raw(['rev-list', '--count', 'HEAD'])
      totalCommits = parseInt(countRaw.trim(), 10)
    } catch {
      totalCommits = 0
    }

    return {
      name: basename(this.repoPath),
      path: this.repoPath,
      remoteUrl,
      currentBranch: status.current || 'HEAD',
      totalCommits,
    }
  }

  /** Get commits within a period, optionally filtered by author */
  async getCommits(since?: string, author?: string): Promise<CommitData[]> {
    const args: Record<string, string | null> = {
      '--since': since || '30 days ago',
      '--no-merges': null,
    }
    if (author) {
      args['--author'] = author
    }

    const log: LogResult = await this.git.log(args)

    return log.all.map((commit) => ({
      hash: commit.hash,
      author: commit.author_name,
      email: commit.author_email,
      date: new Date(commit.date),
      message: commit.message,
      filesChanged: 0,
    }))
  }

  /** Get the most frequently changed files */
  async getHotFiles(since?: string, top = 20): Promise<HotFile[]> {
    const result = await this.git.raw([
      'log',
      '--since',
      since || '30 days ago',
      '--name-only',
      '--format=',
      '--no-merges',
    ])

    const files = calculateHotFiles(result.split('\n'))
    return files.slice(0, top)
  }

  /** Get commit count per developer */
  async getDeveloperStats(since?: string, author?: string): Promise<DeveloperStat[]> {
    const commits = await this.getCommits(since, author)
    const counts: Record<string, number> = {}

    commits.forEach((c) => {
      counts[c.author] = (counts[c.author] || 0) + 1
    })

    const total = commits.length
    if (total === 0) return []

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([author, commitCount]) => ({
        author,
        commits: commitCount,
        percentage: Math.round((commitCount / total) * 100),
      }))
  }

  /** Get commit frequency per week for trend chart */
  async getTrends(weeks = 12): Promise<TrendPoint[]> {
    const points: TrendPoint[] = []
    const now = new Date()

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - i * 7 - 6)
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - i * 7)
      weekEnd.setHours(23, 59, 59, 999)

      const log = await this.git.log({
        '--after': weekStart.toISOString(),
        '--before': weekEnd.toISOString(),
        '--no-merges': null,
      })

      // ISO week label
      const month = weekStart.toLocaleString('en', { month: 'short' })
      const day = weekStart.getDate().toString().padStart(2, '0')
      const year = weekStart.getFullYear()
      const weekNum = getISOWeek(weekStart)

      points.push({
        week: `${year}-W${String(weekNum).padStart(2, '0')}`,
        weekLabel: `${month} ${day}`,
        commits: log.total,
      })
    }

    return points
  }
}

// ─── ISO Week helper ──────────────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
