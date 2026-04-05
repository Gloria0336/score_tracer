import { getDistributionSeries, getSummary, getTrendSeries, sortByRecordedAtDesc } from './analytics'
import type { ScoreRecord } from '../types'

const records: ScoreRecord[] = [
  {
    id: 'a',
    score: 7.4,
    note: 'first',
    recordedAt: '2026-04-05T08:30:00.000Z',
    createdAt: '2026-04-05T08:30:00.000Z',
  },
  {
    id: 'b',
    score: 10.2,
    note: 'second',
    recordedAt: '2026-04-06T08:30:00.000Z',
    createdAt: '2026-04-06T08:30:00.000Z',
  },
]

describe('analytics helpers', () => {
  it('computes summary and latest based on recordedAt', () => {
    expect(getSummary(records)).toMatchObject({
      total: 2,
      min: 7.4,
      max: 10.2,
      latest: 10.2,
    })
  })

  it('sorts newest first for record list', () => {
    expect(sortByRecordedAtDesc(records)[0].id).toBe('b')
  })

  it('creates trend and rounded distribution series', () => {
    expect(getTrendSeries(records)).toHaveLength(2)
    expect(getDistributionSeries(records)).toEqual([
      { bucket: '7 分', count: 1 },
      { bucket: '10 分', count: 1 },
    ])
  })
})
