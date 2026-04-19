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
$ gitai analyze --last 30d --path ./synapse

✔ Analysis complete — 4 commits in last 30d

Analyzing repository: Synapse (last 30d)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Branch: main  •  Total commits: 4

Developer Activity

  Synapse Dev             ██████████████████████████████░░░░░░░░░░  3 commits  75%
  Prodromos Chrysostomou  ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1 commits  25%

Hot Files (changed most often)

┌────┬────────────────────────────────────────────────────────────┬──────────┬────────┐
│ #  │ File                                                       │ Changes  │ Risk   │
├────┼────────────────────────────────────────────────────────────┼──────────┼────────┤
│ 1  │ README.md                                                  │ 4        │ LOW    │
├────┼────────────────────────────────────────────────────────────┼──────────┼────────┤
│ 2  │ .gitignore                                                 │ 1        │ LOW    │
├────┼────────────────────────────────────────────────────────────┼──────────┼────────┤
│ 3  │ app/(app)/dashboard/page.tsx                               │ 1        │ LOW    │
├────┼────────────────────────────────────────────────────────────┼──────────┼────────┤
│ 4  │ app/(app)/doc/[id]/page.tsx                                │ 1        │ LOW    │
├────┼────────────────────────────────────────────────────────────┼──────────┼────────┤
│ 5  │ app/(auth)/login/page.tsx                                  │ 1        │ LOW    │
├────┼────────────────────────────────────────────────────────────┼──────────┼────────┤
│ 6  │ app/(auth)/signup/page.tsx                                 │ 1        │ LOW    │
├────┼────────────────────────────────────────────────────────────┼──────────┼────────┤
│ 7  │ app/api/ai/complete/route.ts                               │ 1        │ LOW    │
├────┼────────────────────────────────────────────────────────────┼──────────┼────────┤
│ 8  │ app/api/auth/callback/route.ts                             │ 1        │ LOW    │
├────┼────────────────────────────────────────────────────────────┼──────────┼────────┤
│ 9  │ app/globals.css                                            │ 1        │ LOW    │
├────┼────────────────────────────────────────────────────────────┼──────────┼────────┤
│ 10 │ app/layout.tsx                                             │ 1        │ LOW    │
└────┴────────────────────────────────────────────────────────────┴──────────┴────────┘

──────────────────────────────────────────────────
AI Sprint Summary

  Over the past 30 days, the team focused on refining the Synapse project's
  foundation, with key commits addressing inaccuracies and inconsistencies in
  the README — corrections to the architecture diagram and removal of unused
  dependencies like Zustand. A significant technical decision was made to
  streamline the project's documentation. The team's velocity has been moderate,
  with a notable initial commit of the Synapse collaborative editor laying the
  groundwork for future development.
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

## Key Technical Decisions

### 1. `simple-git` instead of raw `exec()`

The obvious approach is `child_process.exec('git log ...')` and parse the stdout string manually. The problem: git output format is inconsistent across versions, special characters in commit messages break parsing, and you end up writing a miniature git parser.

`simple-git` wraps the git CLI internally but returns typed JavaScript objects — `log.all` is an array of `{hash, author_name, author_email, date, message}`. The git layer becomes two lines instead of fifty, and the types flow through the entire codebase.

### 2. `tsup` instead of `tsc`

`tsc` compiles TypeScript but doesn't bundle — the output is dozens of `.js` files mirroring your `src/` structure, plus you need to manually handle the `#!/usr/bin/env node` shebang for the CLI entry point.

`tsup` (built on esbuild) produces a **single `dist/index.js`** in ~40ms, injects the shebang automatically via the `banner` config, and tree-shakes unused code. One file is what goes to npm — no `node_modules` leaking into the package, no path resolution issues.

### 3. Groq instead of OpenAI

OpenAI requires a paid account immediately for API access. Groq's free tier gives you Llama 3.3-70b with generous rate limits — enough to run `gitai summary` hundreds of times a day during development and demos.

Beyond cost: Groq's inference is significantly faster (tokens/sec), which matters for streaming output in a terminal. The user sees text appearing in real-time rather than waiting 3–5 seconds for a full response. The SDK interface is identical to OpenAI's, so switching later is a one-line change.

### 4. Pure functions for testable core logic

`calculateHotFiles(lines: string[])` and `parsePeriod(period: string)` are pure functions extracted from the `GitAnalyzer` class. They take strings, return data — no git I/O, no filesystem, no side effects.

This means the most critical logic (aggregation, sorting, period parsing) is covered by unit tests that run in under 30ms, with no mocking needed. Integration tests that require a real git repo are a separate concern. The pattern mirrors how you'd architect a backend service: pure domain logic separated from I/O at the edges.

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
