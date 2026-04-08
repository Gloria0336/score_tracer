import { parseImportedRecords } from './import'

describe('import utilities', () => {
  it('parses JSON exports and preserves emotion', () => {
    const result = parseImportedRecords(
      JSON.stringify({
        records: [
          {
            id: 'json-1',
            score: 12.3,
            emotion: 5,
            note: 'from json',
            recordedAt: '2026-04-06T08:30:00.000Z',
            createdAt: '2026-04-06T08:31:00.000Z',
          },
        ],
      }),
      'backup.json',
    )

    expect(result.skippedCount).toBe(0)
    expect(result.records).toHaveLength(1)
    expect(result.records[0]).toMatchObject({
      id: 'json-1',
      score: 12.3,
      emotion: 5,
    })
  })

  it('parses CSV exports with quoted values', () => {
    const result = parseImportedRecords(
      '\uFEFFid,score,emotion,note,recordedAt,createdAt\r\ncsv-1,9.5,4,"line 1, ""quoted""",2026-04-06T08:30:00.000Z,2026-04-06T08:31:00.000Z',
      'backup.csv',
    )

    expect(result.skippedCount).toBe(0)
    expect(result.records[0]).toMatchObject({
      id: 'csv-1',
      score: 9.5,
      emotion: 4,
      note: 'line 1, "quoted"',
    })
  })

  it('defaults missing emotion in legacy imports', () => {
    const result = parseImportedRecords(
      JSON.stringify([
        {
          id: 'legacy-1',
          score: 8,
          note: 'legacy',
          recordedAt: '2026-04-06T08:30:00.000Z',
          createdAt: '2026-04-06T08:31:00.000Z',
        },
      ]),
      'legacy.json',
    )

    expect(result.records[0].emotion).toBe(3)
  })

  it('throws for unsupported files', () => {
    expect(() => parseImportedRecords('hello', 'notes.txt')).toThrow('僅支援匯入 JSON 或 CSV 檔案。')
  })
})
