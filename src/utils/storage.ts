import type { ScoreRecord } from '../types'

export const STORAGE_KEY = 'score-tracer-records'

export function loadRecords(): ScoreRecord[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isScoreRecord)
  } catch {
    return []
  }
}

export function saveRecords(records: ScoreRecord[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function isScoreRecord(value: unknown): value is ScoreRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.score === 'number' &&
    typeof record.note === 'string' &&
    typeof record.recordedAt === 'string' &&
    typeof record.createdAt === 'string'
  )
}
