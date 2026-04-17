export type EmotionLevel = 0 | 1 | 2 | 3 | 4 | 5

export type ScoreRecordInput = {
  score: number
  emotion: EmotionLevel
  note: string
  recordedAt: string
}

export type ScoreRecord = ScoreRecordInput & {
  id: string
  createdAt: string
}

export type ScoreSummary = {
  total: number
  average: number
  min: number
  max: number
  latest?: number
}

export type TrendPoint = {
  id: string
  score: number
  recordedAt: string
  timestamp: number
  label: string
}

export type DistributionPoint = {
  bucket: string
  count: number
}

export type EmotionAveragePoint = {
  emotion: EmotionLevel
  label: string
  averageScore: number | null
  count: number
}

export type TimePeriodKey = 'lateNight' | 'morning' | 'afternoon' | 'evening'

export type TimePeriodPoint = {
  key: TimePeriodKey
  label: string
  range: string
  averageScore: number | null
  count: number
}
