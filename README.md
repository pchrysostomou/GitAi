<div align="center">

# GitAI 🔍

**AI-powered Git repository analyzer**

Developer stats · Hot files · Complexity trends · Sprint summaries — from the terminal.

[![CI](https://github.com/YOUR_USERNAME/gitai/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/gitai/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/built%20with-TypeScript-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

</div>

---

## Demo

```
$ gitai analyze --last 30d --path ./my-project

Analyzing repository: Synapse (last 30d)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Branch: main  •  Total commits: 4

Developer Activity

  Synapse Dev             █████████████████████████████░░░░░░░░░░░  3 commits  75%
  Prodromos Chrysostomou  ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1 commits  25%

Hot Files (changed most often)

  ┌────┬────────────────────────────────┬──────────┬────────┐
  │ #  │ File                           │ Changes  │ Risk   │
  ├────┼────────────────────────────────┼──────────┼────────┤
  │ 1  │ components/editor/EditorShell  │ 47       │ HIGH   │
  │ 2  │ server/index.ts                │ 31       │ HIGH   │
  │ 3  │ lib/supabase/client.ts         │ 18       │ MED    │
  │ 4  │ app/api/ai/complete/route.ts   │ 12       │ LOW    │
  └────┴────────────────────────────────┴──────────┴────────┘

  ⚠  2 HIGH risk file(s) detected. These change frequently and may need refactoring.

──────────────────────────────────────────────────
AI Sprint Summary

  Over the last 30 days, the team focused on real-time collaboration infrastructure.
  Key work: Y.js CRDT integration, Socket.io room management, and RLS policy fixes
  in Supabase. Velocity increased +23% vs the prior sprint, driven by faster iteration
  on the editor layer and improved test coverage across auth flows.
```

## Commands

| Command | Description |
|---------|-------------|
| `gitai analyze` | Full analysis: stats + hot files + AI sprint summary |
| `gitai stats` | Developer activity — commit counts per person |
| `gitai hotfiles` | Most frequently changed files with risk level |
| `gitai trends` | Commit frequency per week (ASCII chart) |
| `gitai summary` | AI-generated sprint summary (requires API key) |
| `gitai config set` | Store config values (e.g. GROQ_API_KEY) |

### Options

```bash
# All commands support --path to analyze any repo without cd-ing into it
gitai analyze --last 30d --path /path/to/repo
gitai stats   --last 7d  --path /path/to/repo
gitai hotfiles --top 10  --path /path/to/repo
gitai trends  --weeks 12 --path /path/to/repo

# Time period format
7d   → last 7 days
30d  → last 30 days (default)
2w   → last 2 weeks
3m   → last 3 months
1y   → last year

# Filter by author
gitai analyze --last 30d --author "prodromos"
gitai stats   --last 30d --author "makis"
```

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 18+ · TypeScript 5 | Type-safe git objects, same stack as modern web |
| CLI | Commander.js | Industry standard — handles subcommands, flags, `--help` |
| Git | simple-git | Node.js wrapper around git CLI, no manual `exec()` |
| AI | Groq SDK (Llama 3.3-70b) | Free tier, streaming to terminal, token-by-token output |
| Terminal UI | Chalk · ora · cli-table3 | Colors, spinners, formatted tables |
| Build | tsup | Bundles TypeScript to a single CJS file |
| Tests | Vitest | Unit tests for all pure functions |

## Installation

```bash
# Clone & install
git clone https://github.com/YOUR_USERNAME/gitai
cd gitai
npm install

# Build
npm run build

# Link globally (makes `gitai` available everywhere)
npm link

# Set your Groq API key (optional — tool works without it)
gitai config set GROQ_API_KEY gsk_...

# Use inside any git project
cd /path/to/your-project
gitai analyze --last 30d
```

> **Zero dependencies for the end user** — once installed, `gitai` works in any git repo with no additional setup.

## Architecture

```
src/
├── index.ts              # CLI entry point (Commander.js — registers all commands)
├── types.ts              # Shared TypeScript interfaces (CommitData, HotFile, etc.)
├── config/
│   └── index.ts          # ~/.gitai/config.json + cache.json (cross-platform)
├── git/
│   └── analyzer.ts       # GitAnalyzer class · parsePeriod() · calculateHotFiles()
├── ai/
│   └── summarizer.ts     # Groq streaming → stdout, graceful if no API key
├── output/
│   └── formatter.ts      # renderDeveloperStats() · renderHotFiles() · renderTrends()
└── commands/
    ├── analyze.ts         # Orchestrates all layers
    ├── stats.ts
    ├── hotfiles.ts
    ├── trends.ts
    └── summary.ts
```

### Data Flow

```
gitai analyze
    → Commander.js parse flags
    → GitAnalyzer.getCommits() / getHotFiles() / getDeveloperStats()  [parallel]
    → formatter.render*()   [terminal output]
    → Groq streaming summary   [token-by-token to stdout]
```

## Config & Cache

All data stored in `~/.gitai/` (cross-platform via `os.homedir()`):

```
~/.gitai/
├── config.json   # GROQ_API_KEY and other settings
└── cache.json    # Analysis cache (expires after 30 min)
```

```bash
gitai config set GROQ_API_KEY gsk_...   # Store API key
gitai config list                        # Show all config values
gitai cache:clear                        # Clear analysis cache
```

## CI/CD

GitHub Actions runs on every push and PR:

- **Node 18 & 20** matrix — ensures compatibility
- TypeScript type check (`tsc --noEmit`)
- 23 Vitest unit tests
- `tsup` build verification
- Integration test against a fresh git repo

## Development

```bash
npm run dev -- analyze --last 7d      # Run via ts-node (no build needed)
npm test                               # Vitest unit tests (23 tests)
npm run build                          # tsup bundle → dist/
npm run lint                           # TypeScript strict type check
npm run test:watch                     # Watch mode for TDD
```

## Graceful AI Degradation

The tool works fully without a Groq API key. When no key is set:

```
──────────────────────────────────────────────────
  AI Sprint Summary: Set GROQ_API_KEY to enable
  Run: gitai config set GROQ_API_KEY <your-key>
```

All other commands (`stats`, `hotfiles`, `trends`) run without any key.

## License

MIT — [prodromos](https://github.com/YOUR_USERNAME)
