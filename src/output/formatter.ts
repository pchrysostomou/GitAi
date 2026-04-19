import chalk from 'chalk'
import Table from 'cli-table3'
import type { DeveloperStat, HotFile, TrendPoint, RepoInfo } from '../types'

// ─── Header ───────────────────────────────────────────────────────────────────

export function renderHeader(repo: RepoInfo, period: string): void {
  const title = `Analyzing repository: ${chalk.cyan.bold(repo.name)} (${period})`
  const line = '━'.repeat(Math.min(title.replace(/\x1b\[[0-9;]*m/g, '').length, 60))

  console.log()
  console.log(title)
  console.log(chalk.gray(line))
  console.log(
    chalk.gray(`  Branch: ${repo.currentBranch}`) +
      (repo.totalCommits > 0 ? chalk.gray(`  •  Total commits: ${repo.totalCommits}`) : '')
  )
  console.log()
}

// ─── Developer Stats ──────────────────────────────────────────────────────────

export function renderDeveloperStats(stats: DeveloperStat[]): void {
  if (stats.length === 0) {
    console.log(chalk.yellow('  No commits found in this period.'))
    return
  }

  console.log(chalk.green.bold('Developer Activity'))
  console.log()

  const maxNameLen = Math.max(...stats.map((s) => s.author.length), 10)
  const BAR_WIDTH = 40

  stats.forEach(({ author, commits, percentage }) => {
    const barFilled = Math.round((percentage / 100) * BAR_WIDTH)
    const bar =
      chalk.cyan('█'.repeat(barFilled)) + chalk.gray('░'.repeat(BAR_WIDTH - barFilled))

    const name = author.padEnd(maxNameLen)
    const commitsStr = chalk.white(`${commits} commits`)
    const pctStr = chalk.gray(`${percentage}%`)

    console.log(`  ${name}  ${bar}  ${commitsStr}  ${pctStr}`)
  })

  console.log()
}

// ─── Hot Files ────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, chalk.Chalk> = {
  HIGH: chalk.red,
  MED: chalk.yellow,
  LOW: chalk.green,
}

export function renderHotFiles(files: HotFile[], top = 10): void {
  if (files.length === 0) {
    console.log(chalk.yellow('  No file changes found in this period.'))
    return
  }

  console.log(chalk.yellow.bold('Hot Files') + chalk.gray(' (changed most often)'))
  console.log()

  const table = new Table({
    head: ['#', 'File', 'Changes', 'Risk'].map((h) => chalk.gray(h)),
    style: {
      border: ['gray'],
      head: [],
    },
    colWidths: [4, 60, 10, 8],
  })

  files.slice(0, top).forEach(({ file, changeCount, riskLevel }, i) => {
    const riskColor = RISK_COLORS[riskLevel]
    const riskBadge = riskColor(`${riskLevel}`)
    const truncatedFile = file.length > 57 ? '…' + file.slice(-56) : file
    table.push([chalk.gray(String(i + 1)), truncatedFile, chalk.white(String(changeCount)), riskBadge])
  })

  console.log(table.toString())
  console.log()
}

// ─── Trends (ASCII Chart) ─────────────────────────────────────────────────────

export function renderTrends(points: TrendPoint[]): void {
  if (points.length === 0) {
    console.log(chalk.yellow('  No trend data available.'))
    return
  }

  console.log(chalk.magenta.bold('Commit Frequency') + chalk.gray(' (weekly)'))
  console.log()

  const maxCommits = Math.max(...points.map((p) => p.commits), 1)
  const CHART_HEIGHT = 8
  const BAR_CHAR = '▓'
  const EMPTY_CHAR = ' '

  // Build rows top-to-bottom
  for (let row = CHART_HEIGHT; row >= 1; row--) {
    const threshold = Math.ceil((row / CHART_HEIGHT) * maxCommits)
    const yLabel = row === CHART_HEIGHT ? chalk.gray(String(maxCommits).padStart(4)) : '    '

    const bars = points
      .map((p) => {
        const filled = p.commits >= threshold
        return filled ? chalk.cyan(BAR_CHAR) + chalk.cyan(BAR_CHAR) : EMPTY_CHAR + EMPTY_CHAR
      })
      .join(' ')

    console.log(`${yLabel} ${chalk.gray('│')} ${bars}`)
  }

  // X-axis
  const xAxis = chalk.gray('─'.repeat(4 + 2 + points.length * 3))
  console.log(`     ${chalk.gray('└')}${xAxis}`)

  // Labels — show every other one to avoid cramping
  const labels = points
    .map((p, i) => (i % 2 === 0 ? p.weekLabel.padEnd(3).slice(0, 3) : '   '))
    .join(' ')
  console.log(`       ${chalk.gray(labels)}`)

  console.log()
}

// ─── Summary Box ─────────────────────────────────────────────────────────────

export function renderSectionTitle(title: string, icon = '▸'): void {
  console.log(`${chalk.blue(icon)} ${chalk.blue.bold(title)}`)
}

export function renderNoApiKey(): void {
  console.log()
  console.log(chalk.gray('─'.repeat(50)))
  console.log(
    chalk.dim('  AI Sprint Summary: ') +
      chalk.yellow('Set GROQ_API_KEY to enable')
  )
  console.log(
    chalk.dim('  Run: ') +
      chalk.cyan('gitai config set GROQ_API_KEY <your-key>')
  )
  console.log()
}

export function renderError(message: string): void {
  console.error()
  console.error(`${chalk.red('✖')} ${chalk.red(message)}`)
  console.error()
}

export function renderSuccess(message: string): void {
  console.log(`${chalk.green('✔')} ${chalk.green(message)}`)
}
