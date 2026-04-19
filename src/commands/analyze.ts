import ora from 'ora'
import { GitAnalyzer, parsePeriod } from '../git/analyzer'
import { renderHeader, renderDeveloperStats, renderHotFiles, renderNoApiKey, renderError } from '../output/formatter'
import { generateSprintSummary } from '../ai/summarizer'
import { getConfig } from '../config'

interface AnalyzeOptions {
  last: string
  author?: string
}

export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  const period = options.last || '30d'
  const since = parsePeriod(period)

  const analyzer = new GitAnalyzer(process.cwd())

  // Validate we're in a git repo
  const isValid = await analyzer.validate()
  if (!isValid) {
    renderError('Not a git repository. Run gitai inside a git project.')
    process.exit(1)
  }

  const spinner = ora({
    text: 'Analyzing repository…',
    color: 'cyan',
  }).start()

  try {
    // Fetch all data in parallel for speed
    const [repo, developerStats, hotFiles] = await Promise.all([
      analyzer.getRepoInfo(),
      analyzer.getDeveloperStats(since, options.author),
      analyzer.getHotFiles(since, 10),
    ])

    // Also get commits for AI summary
    const commits = await analyzer.getCommits(since, options.author)

    spinner.succeed(`Analysis complete — ${commits.length} commits in last ${period}`)

    // Render output
    renderHeader(repo, `last ${period}`)
    renderDeveloperStats(developerStats)
    renderHotFiles(hotFiles, 10)

    // AI Summary — graceful if no key
    const hasKey = !!getConfig('GROQ_API_KEY')
    if (hasKey) {
      const aiSpinner = ora({ text: 'Generating AI sprint summary…', color: 'blue' }).start()
      aiSpinner.stop()
      await generateSprintSummary(commits, `last ${period}`)
    } else {
      renderNoApiKey()
    }
  } catch (error) {
    spinner.fail('Analysis failed')
    renderError((error as Error).message)
    process.exit(1)
  }
}
