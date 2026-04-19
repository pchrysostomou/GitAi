# GitAI 🔍

> AI-powered Git repository analyzer — developer stats, hot files, complexity trends, and sprint summaries from the terminal.

```
$ gitai analyze --last 30d

Analyzing repository: Synapse (last 30d)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Developer Activity

prodromos        ████████████████████████████░░░░░░░░░░░░  312 commits  68%
makis            ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  147 commits  32%

Hot Files (changed most often)

  #   File                                    Changes  Risk
  1   components/editor/EditorShell.tsx       47       HIGH
  2   server/index.ts                         31       HIGH
  3   lib/supabase/client.ts                  18       MED

AI Sprint Summary

  This sprint focused on real-time collaboration infrastructure.
  Major work: Y.js CRDT integration, Socket.io room management,
  and RLS recursion fix in Supabase. Team velocity: +23% vs last sprint.
```

## Stack

- **Runtime**: Node.js 18+ · TypeScript 5
- **CLI**: Commander.js
- **Git**: simple-git (wraps git CLI)
- **AI**: Groq SDK (Llama 3.3-70b streaming)
- **Terminal UI**: Chalk · ora · cli-table3
- **Build**: tsup
- **Tests**: Vitest

## Commands

```bash
gitai analyze [--last <period>] [--author <name>]
  # Full analysis: stats + hotfiles + AI summary

gitai stats [--last <period>] [--author <name>]
  # Developer activity — commits per person

gitai hotfiles [--top <n>] [--last <period>]
  # Files changed most often (risk indicators)

gitai trends [--weeks <n>]
  # Commit frequency per week — ASCII chart

gitai summary [--last <period>] [--since <date>]
  # AI-generated sprint summary (requires GROQ_API_KEY)

gitai config set GROQ_API_KEY <key>
  # Store API key in ~/.gitai/config.json

gitai config list
  # Show current config
```

### Period format
```
7d    → last 7 days
30d   → last 30 days   (default)
2w    → last 2 weeks
3m    → last 3 months
1y    → last year
```

## Setup

```bash
# Clone and install
git clone https://github.com/yourname/gitai
cd gitai
npm install

# Build
npm run build

# Link globally for testing
npm link

# Set your Groq API key (optional — tool works without it)
gitai config set GROQ_API_KEY gsk_...

# Test inside any git repo
cd /path/to/your-project
gitai analyze --last 30d
```

## Development

```bash
npm run dev -- analyze --last 7d   # Run via ts-node
npm test                            # Vitest unit tests
npm run build                       # tsup bundle to dist/
npm run lint                        # TypeScript type check
```

## Architecture

```
src/
├── index.ts              # CLI entry point (Commander.js)
├── types.ts              # Shared TypeScript interfaces
├── config/
│   └── index.ts          # ~/.gitai/config.json + cache.json
├── git/
│   └── analyzer.ts       # GitAnalyzer class + pure helpers
├── ai/
│   └── summarizer.ts     # Groq streaming summary
├── output/
│   └── formatter.ts      # Terminal UI rendering
└── commands/
    ├── analyze.ts         # gitai analyze
    ├── stats.ts           # gitai stats
    ├── hotfiles.ts        # gitai hotfiles
    ├── trends.ts          # gitai trends
    └── summary.ts         # gitai summary
```

## Config & Cache

All config and cache stored in `~/.gitai/` (cross-platform via `os.homedir()`):

```
~/.gitai/
├── config.json   # API keys, settings
└── cache.json    # Analysis cache (auto-expires after 30min)
```

## License

MIT
