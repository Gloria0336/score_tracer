import type {
  DistributionPoint,
  EmotionAveragePoint,
  EmotionLevel,
  ScoreRecord,
  ScoreSummary,
  TimePeriodKey,
  TimePeriodPoint,
  TrendPoint,
} from '../types'
import { formatChartLabel } from './datetime'
import { getEmotionLabel } from './emotion'

const TIME_PERIODS: Array<{ key: TimePeriodKey; label: string; range: string }> = [
  { key: 'morning', label: '早上', range: '08:00-12:00' },
  { key: 'afternoon', label: '下午', range: '12:00-18:00' },
  { key: 'evening', label: '晚上', range: '18:00-00:00' },
  { key: 'lateNight', label: '深夜', range: '00:00-08:00' },
]

function sortByRecordedAtAsc(records: ScoreRecord[]): ScoreRecord[] {
  return [...records].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  )
}

function getRecordedHour(recordedAt: string): number {
  const matched = recordedAt.match(/T(\d{2}):\d{2}/)

  if (matched) {
    return Number(matched[1])
  }

  return new Date(recordedAt).getHours()
}

function getTimePeriodKey(recordedAt: string): TimePeriodKey {
  const hour = getRecordedHour(recordedAt)

  if (hour >= 8 && hour < 12) {
    return 'morning'
  }

  if (hour >= 12 && hour < 18) {
    return 'afternoon'
  }

  if (hour >= 18) {
    return 'evening'
  }

  return 'lateNight'
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

export function getTimePeriodSeries(records: ScoreRecord[]): TimePeriodPoint[] {
  const aggregate = new Map<TimePeriodKey, { totalScore: number; count: number }>()

  records.forEach((record) => {
    const key = getTimePeriodKey(record.recordedAt)
    const current = aggregate.get(key) ?? { totalScore: 0, count: 0 }

    aggregate.set(key, {
      totalScore: current.totalScore + record.score,
      count: current.count + 1,
    })
  })

  return TIME_PERIODS.map(({ key, label, range }) => {
    const current = aggregate.get(key)

    return {
      key,
      label,
      range,
      averageScore: current ? current.totalScore / current.count : null,
      count: current?.count ?? 0,
    }
  })
}
