import type { EmotionLevel, ScoreRecord } from '../types'

export const STORAGE_KEY = 'score-tracer-records'
export const DEFAULT_EMOTION_LEVEL: EmotionLevel = 3

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

    return parsed.map(normalizeStoredRecord).filter((record): record is ScoreRecord => record !== null)
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

function normalizeStoredRecord(value: unknown): ScoreRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const score = typeof record.score === 'number' ? record.score : Number(record.score)
  const note = typeof record.note === 'string' ? record.note : ''
  const emotion = normalizeEmotion(record.emotion)

  if (
    typeof record.id !== 'string' ||
    !Number.isFinite(score) ||
    typeof record.recordedAt !== 'string' ||
    typeof record.createdAt !== 'string'
  ) {
    return null
  }

  return {
    id: record.id,
    score,
    emotion,
    note,
    recordedAt: record.recordedAt,
    createdAt: record.createdAt,
  }
}

function normalizeEmotion(value: unknown): EmotionLevel {
  const emotion = typeof value === 'number' ? value : Number(value)

  if (Number.isInteger(emotion) && emotion >= 0 && emotion <= 5) {
    return emotion as EmotionLevel
  }

  return DEFAULT_EMOTION_LEVEL
}
