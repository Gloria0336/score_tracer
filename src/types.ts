export type ScoreRecord = {
  id: string
  score: number
  note: string
  recordedAt: string
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
  label: string
}

export type DistributionPoint = {
  bucket: string
  count: number
}
