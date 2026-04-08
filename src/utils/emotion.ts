import type { EmotionLevel } from '../types'
import { DEFAULT_EMOTION_LEVEL } from './storage'

export const EMOTION_OPTIONS: Array<{ value: EmotionLevel; label: string }> = [
  { value: 0, label: '0 極差' },
  { value: 1, label: '1 很低' },
  { value: 2, label: '2 偏低' },
  { value: 3, label: '3 普通' },
  { value: 4, label: '4 不錯' },
  { value: 5, label: '5 很好' },
]

export function getEmotionLabel(level: EmotionLevel): string {
  return EMOTION_OPTIONS.find((option) => option.value === level)?.label ?? `${level}`
}

export function normalizeEmotionLevel(value: unknown): EmotionLevel {
  const emotion = typeof value === 'number' ? value : Number(value)

  if (Number.isInteger(emotion) && emotion >= 0 && emotion <= 5) {
    return emotion as EmotionLevel
  }

  return DEFAULT_EMOTION_LEVEL
}
