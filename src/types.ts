// Shared TypeScript interfaces for GitAI

export interface CommitData {
  hash: string
  author: string
  email: string
  date: Date
  message: string
  filesChanged: number
}

export interface HotFile {
  file: string
  changeCount: number
  riskLevel: 'HIGH' | 'MED' | 'LOW'
}

export interface DeveloperStat {
  author: string
  commits: number
  percentage: number
}

export interface TrendPoint {
  week: string        // e.g. "2024-W01"
  weekLabel: string   // e.g. "Jan 01"
  commits: number
}

export interface RepoInfo {
  name: string
  path: string
  remoteUrl?: string
  currentBranch: string
  totalCommits: number
}

export interface AnalysisResult {
  repo: RepoInfo
  period: string
  developerStats: DeveloperStat[]
  hotFiles: HotFile[]
  trends: TrendPoint[]
  commits: CommitData[]
}

export interface GitAIConfig {
  GROQ_API_KEY?: string
  defaultPeriod?: string
  defaultTop?: number
  defaultWeeks?: number
}
