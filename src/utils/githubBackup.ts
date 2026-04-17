import type { ScoreRecord } from '../types'

export const GITHUB_BACKUP_SETTINGS_KEY = 'score-tracer-github-backup-settings'

export type GitHubBackupTrigger = 'manual' | 'auto'

export type GitHubBackupConfig = {
  owner: string
  repo: string
  branch: string
  path: string
  token: string
  autoBackup: boolean
}

export type GitHubBackupResult = {
  commitUrl?: string
  committedAt: string
  path: string
  sha: string
}

type BackupOptions = {
  committedAt?: Date
  trigger?: GitHubBackupTrigger
}

type GitHubContentResponse = {
  commit?: {
    html_url?: string
  }
  content?: {
    sha?: string
  }
  message?: string
  sha?: string
}

const DEFAULT_BRANCH = 'main'
const DEFAULT_PATH = 'backups/score-tracer-records.json'

const DEFAULT_CONFIG: GitHubBackupConfig = {
  owner: '',
  repo: '',
  branch: DEFAULT_BRANCH,
  path: DEFAULT_PATH,
  token: '',
  autoBackup: false,
}

export function loadGitHubBackupConfig(): GitHubBackupConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG
  }

  const raw = window.localStorage.getItem(GITHUB_BACKUP_SETTINGS_KEY)
  if (!raw) {
    return DEFAULT_CONFIG
  }

  try {
    const parsed = JSON.parse(raw)
    return normalizeGitHubBackupConfig(parsed)
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveGitHubBackupConfig(config: GitHubBackupConfig): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    GITHUB_BACKUP_SETTINGS_KEY,
    JSON.stringify(normalizeGitHubBackupConfig(config)),
  )
}

export function isGitHubBackupConfigured(config: GitHubBackupConfig): boolean {
  const normalized = normalizeGitHubBackupConfig(config)

  return [normalized.owner, normalized.repo, normalized.branch, normalized.path, normalized.token].every(Boolean)
}

export function buildGitHubBackupPayload(records: ScoreRecord[], committedAt = new Date()): string {
  return JSON.stringify(
    {
      app: 'score-tracer',
      committedAt: committedAt.toISOString(),
      recordCount: records.length,
      records,
      schemaVersion: 1,
    },
    null,
    2,
  )
}

export async function backupRecordsToGitHub(
  records: ScoreRecord[],
  config: GitHubBackupConfig,
  options: BackupOptions = {},
  fetchImpl: typeof fetch = fetch,
): Promise<GitHubBackupResult> {
  const normalized = normalizeGitHubBackupConfig(config)

  if (!isGitHubBackupConfigured(normalized)) {
    throw new Error('Please complete the GitHub backup settings before starting a backup.')
  }

  const committedAt = options.committedAt ?? new Date()
  const url = buildContentsUrl(normalized)
  const headers = buildGitHubHeaders(normalized.token)
  const existingSha = await getExistingBackupSha(url, headers, fetchImpl)
  const content = buildGitHubBackupPayload(records, committedAt)
  const response = await fetchImpl(url, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      branch: normalized.branch,
      content: encodeBase64Utf8(content),
      message: buildCommitMessage(options.trigger ?? 'manual', committedAt, records.length),
      path: normalized.path,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  })

  const data = (await parseGitHubJson(response)) as GitHubContentResponse
  if (!response.ok) {
    throw new Error(getGitHubErrorMessage(data.message, 'GitHub backup failed.'))
  }

  const sha = data.content?.sha
  if (!sha) {
    throw new Error('GitHub backup finished without returning a file SHA.')
  }

  return {
    commitUrl: data.commit?.html_url,
    committedAt: committedAt.toISOString(),
    path: normalized.path,
    sha,
  }
}

function normalizeGitHubBackupConfig(value: unknown): GitHubBackupConfig {
  if (!value || typeof value !== 'object') {
    return DEFAULT_CONFIG
  }

  const config = value as Partial<GitHubBackupConfig>

  return {
    owner: normalizeString(config.owner),
    repo: normalizeString(config.repo),
    branch: normalizeString(config.branch) || DEFAULT_BRANCH,
    path: normalizePath(config.path) || DEFAULT_PATH,
    token: normalizeString(config.token),
    autoBackup: Boolean(config.autoBackup),
  }
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizePath(value: unknown): string {
  const path = normalizeString(value)
  return path.replace(/^\/+/, '')
}

function buildContentsUrl(config: GitHubBackupConfig): string {
  const encodedPath = config.path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodedPath}?ref=${encodeURIComponent(config.branch)}`
}

function buildGitHubHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function getExistingBackupSha(
  url: string,
  headers: HeadersInit,
  fetchImpl: typeof fetch,
): Promise<string | undefined> {
  const response = await fetchImpl(url, {
    method: 'GET',
    headers,
  })

  if (response.status === 404) {
    return undefined
  }

  const data = (await parseGitHubJson(response)) as GitHubContentResponse
  if (!response.ok) {
    throw new Error(getGitHubErrorMessage(data.message, 'Unable to read the existing GitHub backup file.'))
  }

  return data.sha
}

async function parseGitHubJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function buildCommitMessage(trigger: GitHubBackupTrigger, committedAt: Date, count: number): string {
  const timestamp = committedAt.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const source = trigger === 'auto' ? 'auto backup' : 'manual backup'

  return `chore: ${source} ${count} records at ${timestamp}`
}

function getGitHubErrorMessage(message: string | undefined, fallback: string): string {
  if (!message) {
    return fallback
  }

  if (/bad credentials/i.test(message)) {
    return 'GitHub token is invalid. Please update the Personal Access Token and try again.'
  }

  if (/not found/i.test(message)) {
    return 'GitHub repository or backup path was not found. Please check the owner, repository, branch, and path.'
  }

  return `GitHub backup failed: ${message}`
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (let index = 0; index < bytes.length; index += 0x8000) {
    const chunk = bytes.slice(index, index + 0x8000)
    binary += String.fromCharCode(...chunk)
  }

  if (typeof btoa === 'function') {
    return btoa(binary)
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }

  throw new Error('Base64 encoding is unavailable in this environment.')
}
