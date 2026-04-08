import type {
  DistributionPoint,
  EmotionAveragePoint,
  EmotionLevel,
  ScoreRecord,
  ScoreSummary,
  TrendPoint,
} from '../types'
import { formatChartLabel } from './datetime'
import { getEmotionLabel } from './emotion'

function sortByRecordedAtAsc(records: ScoreRecord[]): ScoreRecord[] {
  return [...records].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  )
}

export function sortByRecordedAtDesc(records: ScoreRecord[]): ScoreRecord[] {
  return [...records].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  )
}

export function getSummary(records: ScoreRecord[]): ScoreSummary {
  if (records.length === 0) {
    return {
      total: 0,
      average: 0,
      min: 0,
      max: 0,
      latest: undefined,
    }
  }

  const ordered = sortByRecordedAtAsc(records)
  const scores = ordered.map((record) => record.score)
  const total = scores.length
  const average = scores.reduce((sum, score) => sum + score, 0) / total

  return {
    total,
    average,
    min: Math.min(...scores),
    max: Math.max(...scores),
    latest: ordered.at(-1)?.score,
  }
}

export function getTrendSeries(records: ScoreRecord[]): TrendPoint[] {
  return sortByRecordedAtAsc(records).map((record) => ({
    id: record.id,
    score: record.score,
    recordedAt: record.recordedAt,
    label: formatChartLabel(record.recordedAt),
  }))
}

export function getDistributionSeries(records: ScoreRecord[]): DistributionPoint[] {
  const buckets = new Map<number, number>()

  records.forEach((record) => {
    const rounded = Math.round(record.score)
    buckets.set(rounded, (buckets.get(rounded) ?? 0) + 1)
  })

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, count]) => ({
      bucket: `${bucket} 分`,
      count,
    }))
}

export function getEmotionAverageSeries(records: ScoreRecord[]): EmotionAveragePoint[] {
  const aggregate = new Map<EmotionLevel, { totalScore: number; count: number }>()

  records.forEach((record) => {
    const current = aggregate.get(record.emotion) ?? { totalScore: 0, count: 0 }
    aggregate.set(record.emotion, {
      totalScore: current.totalScore + record.score,
      count: current.count + 1,
    })
  })

  return [0, 1, 2, 3, 4, 5].map((emotion) => {
    const current = aggregate.get(emotion as EmotionLevel)

    return {
      emotion: emotion as EmotionLevel,
      label: getEmotionLabel(emotion as EmotionLevel),
      averageScore: current ? current.totalScore / current.count : null,
      count: current?.count ?? 0,
    }
  })
}
