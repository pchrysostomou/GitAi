import ora from 'ora'
import { GitAnalyzer, parsePeriod } from '../git/analyzer'
import { renderNoApiKey, renderError } from '../output/formatter'
import { getConfig } from '../config'
import { generateSprintSummary } from '../ai/summarizer'
import chalk from 'chalk'

interface SummaryOptions {
  since: string
  last: string
}

export async function summaryCommand(options: SummaryOptions): Promise<void> {
  const period = options.last || '30d'
  const since = options.since ? options.since : parsePeriod(period)

  const apiKey = getConfig('GROQ_API_KEY')
  if (!apiKey) {
    renderNoApiKey()
    console.log(chalk.gray('  The summary command requires a Groq API key.'))
    console.log(chalk.gray('  All other commands work without one.'))
    console.log()
    process.exit(0)
  }

  const analyzer = new GitAnalyzer(process.cwd())

  const isValid = await analyzer.validate()
  if (!isValid) {
    renderError('Not a git repository.')
    process.exit(1)
  }

  const spinner = ora({ text: 'Fetching commits…', color: 'blue' }).start()

  try {
    const commits = await analyzer.getCommits(since)
    spinner.succeed(`Loaded ${commits.length} commits`)

    if (commits.length === 0) {
      console.log(chalk.yellow('\n  No commits found in this period.'))
      return
    }

    console.log()
    await generateSprintSummary(commits, options.since ? `since ${options.since}` : `last ${period}`)
  } catch (error) {
    spinner.fail('Failed to generate summary')
    renderError((error as Error).message)
    process.exit(1)
  }
}
