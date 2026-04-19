import { homedir } from 'os'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import type { GitAIConfig } from '../types'

const CONFIG_DIR = join(homedir(), '.gitai')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
const CACHE_FILE = join(CONFIG_DIR, 'cache.json')

// ─── Config ──────────────────────────────────────────────────────────────────

function loadConfig(): GitAIConfig {
  if (!existsSync(CONFIG_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as GitAIConfig
  } catch {
    return {}
  }
}

export function getConfig(key: keyof GitAIConfig): string | undefined {
  // Env var takes priority over config file
  if (key === 'GROQ_API_KEY' && process.env.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY
  }
  const config = loadConfig()
  return config[key] as string | undefined
}

export function setConfig(key: string, value: string): void {
  mkdirSync(CONFIG_DIR, { recursive: true })
  const config = existsSync(CONFIG_FILE)
    ? (JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as Record<string, string>)
    : {}
  config[key] = value
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

export function listConfig(): Record<string, string> {
  return loadConfig() as Record<string, string>
}

// ─── Cache ───────────────────────────────────────────────────────────────────

interface CacheEntry {
  timestamp: number
  ttlMs: number
  data: unknown
}

type CacheStore = Record<string, CacheEntry>

function loadCache(): CacheStore {
  if (!existsSync(CACHE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) as CacheStore
  } catch {
    return {}
  }
}

function saveCache(cache: CacheStore): void {
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

export function getCached<T>(key: string): T | null {
  const cache = loadCache()
  const entry = cache[key]
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttlMs) {
    // Expired
    delete cache[key]
    saveCache(cache)
    return null
  }
  return entry.data as T
}

export function setCached<T>(key: string, data: T, ttlMs = 1000 * 60 * 30): void {
  const cache = loadCache()
  cache[key] = { timestamp: Date.now(), ttlMs, data }
  saveCache(cache)
}

export function clearCache(): void {
  if (existsSync(CACHE_FILE)) {
    writeFileSync(CACHE_FILE, JSON.stringify({}, null, 2))
  }
}

export { CONFIG_DIR }
