import ora from 'ora'
import { GitAnalyzer } from '../git/analyzer'
import { renderTrends, renderError } from '../output/formatter'
import chalk from 'chalk'

interface TrendsOptions {
  weeks: string
  path?: string
}

export async function trendsCommand(options: TrendsOptions): Promise<void> {
  const weeks = parseInt(options.weeks, 10) || 12

  if (weeks < 2 || weeks > 52) {
    renderError('--weeks must be between 2 and 52')
    process.exit(1)
  }

  const analyzer = new GitAnalyzer(options.path || process.cwd())

  const isValid = await analyzer.validate()
  if (!isValid) {
    renderError('Not a git repository.')
    process.exit(1)
  }

  const spinner = ora({ text: `Calculating ${weeks}-week trend…`, color: 'magenta' }).start()

  try {
    const [repo, trends] = await Promise.all([
      analyzer.getRepoInfo(),
      analyzer.getTrends(weeks),
    ])

    const totalCommits = trends.reduce((sum, t) => sum + t.commits, 0)
    const avgCommits = Math.round(totalCommits / weeks)

    spinner.succeed(`${weeks}-week trend loaded — avg ${avgCommits} commits/week`)

    console.log()
    console.log(
      chalk.cyan.bold(repo.name) + chalk.gray(` · last ${weeks} weeks · ${totalCommits} total commits`)
    )
    console.log()

    renderTrends(trends)

    // Velocity comparison: last 4 weeks vs prior 4 weeks
    if (weeks >= 8) {
      const half = Math.floor(weeks / 2)
      const recent = trends.slice(-half).reduce((s, t) => s + t.commits, 0)
      const prior = trends.slice(0, half).reduce((s, t) => s + t.commits, 0)
      if (prior > 0) {
        const change = Math.round(((recent - prior) / prior) * 100)
        const sign = change >= 0 ? '+' : ''
        const color = change >= 0 ? chalk.green : chalk.red
        console.log(
          `  Velocity vs prior ${half} weeks: ${color(`${sign}${change}%`)}`
        )
        console.log()
      }
    }
  } catch (error) {
    spinner.fail('Failed to calculate trends')
    renderError((error as Error).message)
    process.exit(1)
  }
}
