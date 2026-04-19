import ora from 'ora'
import { GitAnalyzer, parsePeriod } from '../git/analyzer'
import { renderDeveloperStats, renderError } from '../output/formatter'
import chalk from 'chalk'

interface StatsOptions {
  last: string
  author?: string
}

export async function statsCommand(options: StatsOptions): Promise<void> {
  const period = options.last || '30d'
  const since = parsePeriod(period)

  const analyzer = new GitAnalyzer(process.cwd())

  const isValid = await analyzer.validate()
  if (!isValid) {
    renderError('Not a git repository.')
    process.exit(1)
  }

  const spinner = ora({ text: 'Fetching developer stats…', color: 'cyan' }).start()

  try {
    const [repo, stats] = await Promise.all([
      analyzer.getRepoInfo(),
      analyzer.getDeveloperStats(since, options.author),
    ])

    const total = stats.reduce((sum, s) => sum + s.commits, 0)
    spinner.succeed(`Found ${total} commits in last ${period} across ${stats.length} developer(s)`)

    console.log()
    console.log(
      chalk.cyan.bold(repo.name) +
        chalk.gray(` · last ${period}`) +
        (options.author ? chalk.gray(` · author: ${options.author}`) : '')
    )
    console.log()

    renderDeveloperStats(stats)
  } catch (error) {
    spinner.fail('Failed to fetch stats')
    renderError((error as Error).message)
    process.exit(1)
  }
}
