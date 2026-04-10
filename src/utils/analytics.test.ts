import {
  getDistributionSeries,
  getEmotionAverageSeries,
  getSummary,
  getTimePeriodSeries,
  getTrendSeries,
  sortByRecordedAtDesc,
} from './analytics'
import type { ScoreRecord } from '../types'

const records: ScoreRecord[] = [
  {
    id: 'a',
    score: 7.4,
    emotion: 2,
    note: 'first',
    recordedAt: '2026-04-05T08:30:00.000Z',
    createdAt: '2026-04-05T08:30:00.000Z',
  },
  {
    id: 'b',
    score: 10.2,
    emotion: 4,
    note: 'second',
    recordedAt: '2026-04-06T08:30:00.000Z',
    createdAt: '2026-04-06T08:30:00.000Z',
  },
  {
    id: 'c',
    score: 8.8,
    emotion: 4,
    note: 'third',
    recordedAt: '2026-04-07T08:30:00.000Z',
    createdAt: '2026-04-07T08:30:00.000Z',
  },
]

describe('analytics helpers', () => {
  it('computes summary and latest based on recordedAt', () => {
    expect(getSummary(records)).toMatchObject({
      total: 3,
      min: 7.4,
      max: 10.2,
      latest: 8.8,
    })
  })

  it('sorts newest first for record list', () => {
    expect(sortByRecordedAtDesc(records)[0].id).toBe('c')
  })

  it('creates trend and rounded distribution series', () => {
    expect(getTrendSeries(records)).toHaveLength(3)
    expect(getDistributionSeries(records)).toEqual([
      { bucket: '7 分', count: 1 },
      { bucket: '9 分', count: 1 },
      { bucket: '10 分', count: 1 },
    ])
  })

  it('creates emotion average series for each mood level', () => {
    const series = getEmotionAverageSeries(records)

    expect(series).toHaveLength(6)
    expect(series[2]).toMatchObject({ emotion: 2, averageScore: 7.4, count: 1 })
    expect(series[4]).toMatchObject({ emotion: 4, averageScore: 9.5, count: 2 })
    expect(series[0]).toMatchObject({ emotion: 0, averageScore: null, count: 0 })
  })

  it('creates time period average and count series', () => {
    const series = getTimePeriodSeries([
      {
        id: 'morning',
        score: 8,
        emotion: 3,
        note: '',
        recordedAt: '2026-04-07T09:30:00+08:00',
        createdAt: '2026-04-07T09:30:00+08:00',
      },
      {
        id: 'afternoon',
        score: 12,
        emotion: 3,
        note: '',
        recordedAt: '2026-04-07T13:30:00+08:00',
        createdAt: '2026-04-07T13:30:00+08:00',
      },
      {
        id: 'evening-a',
        score: 10,
        emotion: 3,
        note: '',
        recordedAt: '2026-04-07T19:30:00+08:00',
        createdAt: '2026-04-07T19:30:00+08:00',
      },
      {
        id: 'evening-b',
        score: 14,
        emotion: 3,
        note: '',
        recordedAt: '2026-04-07T23:30:00+08:00',
        createdAt: '2026-04-07T23:30:00+08:00',
      },
      {
        id: 'late-night',
        score: 6,
        emotion: 3,
        note: '',
        recordedAt: '2026-04-07T03:30:00+08:00',
        createdAt: '2026-04-07T03:30:00+08:00',
      },
    ])

    expect(series).toEqual([
      { key: 'morning', label: '早上', range: '08:00-12:00', averageScore: 8, count: 1 },
      { key: 'afternoon', label: '下午', range: '12:00-18:00', averageScore: 12, count: 1 },
      { key: 'evening', label: '晚上', range: '18:00-00:00', averageScore: 12, count: 2 },
      { key: 'lateNight', label: '深夜', range: '00:00-08:00', averageScore: 6, count: 1 },
    ])
  })
})
