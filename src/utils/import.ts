import type { ScoreRecord } from '../types'
import { normalizeEmotionLevel } from './emotion'
import { DEFAULT_EMOTION_LEVEL } from './storage'

export type ImportResult = {
  records: ScoreRecord[]
  skippedCount: number
}

export function parseImportedRecords(content: string, filename: string): ImportResult {
  const normalizedContent = content.replace(/^\uFEFF/, '').trim()
  const normalizedName = filename.toLowerCase()

  if (normalizedName.endsWith('.json') || /^[\[{]/.test(normalizedContent)) {
    return parseJsonRecords(normalizedContent)
  }

  if (normalizedName.endsWith('.csv')) {
    return parseCsvRecords(normalizedContent)
  }

  throw new Error('僅支援匯入 JSON 或 CSV 檔案。')
}

function parseJsonRecords(content: string): ImportResult {
  const parsed = JSON.parse(content)
  const source = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { records?: unknown[] }).records)
      ? (parsed as { records: unknown[] }).records
      : null

  if (!source) {
    throw new Error('JSON 格式不正確，找不到 records 陣列。')
  }

  return normalizeImportedRecords(source)
}

function parseCsvRecords(content: string): ImportResult {
  const rows = parseCsv(content)
  if (rows.length <= 1) {
    return { records: [], skippedCount: 0 }
  }

  const header = rows[0].map((cell) => cell.trim())
  const records = rows.slice(1).map((row) =>
    header.reduce<Record<string, string>>((current, columnName, index) => {
      current[columnName] = row[index] ?? ''
      return current
    }, {}),
  )

  return normalizeImportedRecords(records)
}

function normalizeImportedRecords(source: unknown[]): ImportResult {
  let skippedCount = 0
  const records = source
    .map((item) => {
      const normalized = normalizeImportedRecord(item)
      if (!normalized) {
        skippedCount += 1
      }
      return normalized
    })
    .filter((record): record is ScoreRecord => record !== null)

  return { records, skippedCount }
}

function normalizeImportedRecord(value: unknown): ScoreRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const score = typeof record.score === 'number' ? record.score : Number(record.score)
  const recordedAt = normalizeTimestamp(record.recordedAt)

  if (!Number.isFinite(score) || !recordedAt) {
    return null
  }

  const createdAt = normalizeTimestamp(record.createdAt) ?? recordedAt
  const id =
    typeof record.id === 'string' && record.id.trim().length > 0 ? record.id.trim() : createImportId()

  return {
    id,
    score,
    emotion:
      record.emotion === undefined ? DEFAULT_EMOTION_LEVEL : normalizeEmotionLevel(record.emotion),
    note: typeof record.note === 'string' ? record.note : '',
    recordedAt,
    createdAt,
  }
}

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function createImportId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `imported-${Math.random().toString(36).slice(2, 10)}`
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let insideQuotes = false

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]
    const next = content[index + 1]

    if (insideQuotes) {
      if (character === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') {
        insideQuotes = false
      } else {
        cell += character
      }
      continue
    }

    if (character === '"') {
      insideQuotes = true
      continue
    }

    if (character === ',') {
      row.push(cell)
      cell = ''
      continue
    }

    if (character === '\r' && next === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      index += 1
      continue
    }

    if (character === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += character
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((current) => current.some((cellValue) => cellValue.trim().length > 0))
}
