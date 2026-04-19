import ora from 'ora'
import { GitAnalyzer, parsePeriod } from '../git/analyzer'
import { renderHotFiles, renderError } from '../output/formatter'
import chalk from 'chalk'

interface HotfilesOptions {
  top: string
  last: string
  path?: string
}

export async function hotfilesCommand(options: HotfilesOptions): Promise<void> {
  const top = parseInt(options.top, 10) || 10
  const period = options.last || '30d'
  const since = parsePeriod(period)

  const analyzer = new GitAnalyzer(options.path || process.cwd())

  const isValid = await analyzer.validate()
  if (!isValid) {
    renderError('Not a git repository.')
    process.exit(1)
  }

  const spinner = ora({ text: 'Finding hot files…', color: 'yellow' }).start()

  try {
    const [repo, files] = await Promise.all([
      analyzer.getRepoInfo(),
      analyzer.getHotFiles(since, top),
    ])

    spinner.succeed(`Found ${files.length} hot files in last ${period}`)

    console.log()
    console.log(
      chalk.cyan.bold(repo.name) + chalk.gray(` · last ${period} · top ${top} files`)
    )
    console.log()

    renderHotFiles(files, top)

    // Hint for high-risk files
    const highRisk = files.filter((f) => f.riskLevel === 'HIGH')
    if (highRisk.length > 0) {
      console.log(
        chalk.red(`  ⚠  ${highRisk.length} HIGH risk file(s) detected.`) +
          chalk.gray(' These change frequently and may need refactoring.')
      )
      console.log()
    }
  } catch (error) {
    spinner.fail('Failed to fetch hot files')
    renderError((error as Error).message)
    process.exit(1)
  }
}
