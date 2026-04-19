import Groq from 'groq-sdk'
import chalk from 'chalk'
import { getConfig } from '../config'
import type { CommitData } from '../types'

/**
 * Generates a streaming AI sprint summary from commit messages via Groq.
 * Prints directly to stdout token-by-token (like ChatGPT).
 *
 * Returns true if summary was generated, false if skipped (no API key).
 */
export async function generateSprintSummary(
  commits: CommitData[],
  period: string
): Promise<boolean> {
  const apiKey = getConfig('GROQ_API_KEY')

  if (!apiKey) {
    return false
  }

  const groq = new Groq({ apiKey })

  // Take up to 50 commits to stay within context limits
  const commitList = commits
    .slice(0, 50)
    .map((c) => `- ${c.author}: ${c.message}`)
    .join('\n')

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      stream: true,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `You are a technical lead summarizing git activity for a sprint review.
Be concise, technical, and specific. 3-4 sentences maximum.
Focus on: what changed, key technical decisions, and team velocity.
Do not use bullet points — write in flowing prose.`,
        },
        {
          role: 'user',
          content: `Summarize this ${period} of git commits:\n\n${commitList}`,
        },
      ],
    })

    console.log()
    console.log(chalk.gray('─'.repeat(50)))
    process.stdout.write(chalk.blue.bold('AI Sprint Summary') + '\n\n')
    process.stdout.write(chalk.white('  '))

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || ''
      process.stdout.write(text)
    }

    process.stdout.write('\n\n')
    return true
  } catch (error) {
    const err = error as { message?: string; status?: number }
    if (err.status === 401) {
      console.log(chalk.red('\n  Invalid GROQ_API_KEY. Run: gitai config set GROQ_API_KEY <key>'))
    } else {
      console.log(chalk.yellow(`\n  AI summary failed: ${err.message || 'Unknown error'}`))
    }
    return false
  }
}
