import { Command } from 'commander'
import chalk from 'chalk'
import { analyzeCommand } from './commands/analyze'
import { statsCommand } from './commands/stats'
import { hotfilesCommand } from './commands/hotfiles'
import { trendsCommand } from './commands/trends'
import { summaryCommand } from './commands/summary'
import { setConfig, listConfig, clearCache } from './config'

const program = new Command()

// ─── Program metadata ─────────────────────────────────────────────────────────

program
  .name('gitai')
  .description(
    chalk.cyan('GitAI') +
      ' — AI-powered Git repository analyzer\n' +
      chalk.gray('  Developer stats · Hot files · Trends · Sprint summaries')
  )
  .version('0.1.0', '-v, --version', 'Output the current version')

// ─── analyze ─────────────────────────────────────────────────────────────────

program
  .command('analyze')
  .description('Full repository analysis: stats + hotfiles + AI sprint summary')
  .option('-l, --last <period>', 'Time period to analyze (e.g. 7d, 30d, 2w, 3m)', '30d')
  .option('-a, --author <name>', 'Filter by author name')
  .action(analyzeCommand)

// ─── stats ────────────────────────────────────────────────────────────────────

program
  .command('stats')
  .description('Developer activity — commit counts and percentages per person')
  .option('-l, --last <period>', 'Time period (e.g. 7d, 30d, 2w)', '30d')
  .option('-a, --author <name>', 'Filter by author name')
  .action(statsCommand)

// ─── hotfiles ────────────────────────────────────────────────────────────────

program
  .command('hotfiles')
  .description('Files changed most frequently (risk indicator for refactoring)')
  .option('-t, --top <n>', 'Number of files to show', '10')
  .option('-l, --last <period>', 'Time period (e.g. 7d, 30d, 2w)', '30d')
  .action(hotfilesCommand)

// ─── trends ──────────────────────────────────────────────────────────────────

program
  .command('trends')
  .description('Commit frequency per week — ASCII chart showing velocity over time')
  .option('-w, --weeks <n>', 'Number of weeks to show', '12')
  .action(trendsCommand)

// ─── summary ─────────────────────────────────────────────────────────────────

program
  .command('summary')
  .description('AI-generated sprint summary from commit messages (requires GROQ_API_KEY)')
  .option('-l, --last <period>', 'Time period (e.g. 7d, 30d)', '30d')
  .option('-s, --since <date>', 'Analyze commits since a specific date (e.g. 2024-01-01)')
  .action(summaryCommand)

// ─── config ──────────────────────────────────────────────────────────────────

const configCmd = program
  .command('config')
  .description('Manage GitAI configuration stored in ~/.gitai/config.json')

configCmd
  .command('set <key> <value>')
  .description('Set a config value (e.g. GROQ_API_KEY)')
  .action((key: string, value: string) => {
    setConfig(key, value)
    console.log(`${chalk.green('✔')} Set ${chalk.cyan(key)}`)
  })

configCmd
  .command('list')
  .description('List all config values')
  .action(() => {
    const config = listConfig()
    const keys = Object.keys(config)
    if (keys.length === 0) {
      console.log(chalk.gray('  No config values set.'))
      console.log(chalk.gray('  Try: gitai config set GROQ_API_KEY <your-key>'))
      return
    }
    console.log()
    keys.forEach((key) => {
      const value = key.includes('KEY') || key.includes('SECRET')
        ? chalk.gray('***' + String(config[key as keyof typeof config]).slice(-4))
        : chalk.white(config[key as keyof typeof config])
      console.log(`  ${chalk.cyan(key)}: ${value}`)
    })
    console.log()
  })

// ─── cache ────────────────────────────────────────────────────────────────────

program
  .command('cache:clear')
  .description('Clear the analysis cache stored in ~/.gitai/cache.json')
  .action(() => {
    clearCache()
    console.log(`${chalk.green('✔')} Cache cleared`)
  })

// ─── Global error handling ────────────────────────────────────────────────────

program.on('command:*', (operands: string[]) => {
  console.error(chalk.red(`\n  Unknown command: ${operands[0]}`))
  console.error(chalk.gray('  Run gitai --help to see available commands\n'))
  process.exit(1)
})

program.parse(process.argv)

// Show help if no command given
if (process.argv.length < 3) {
  program.help()
}
