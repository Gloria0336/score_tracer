import type { ScoreRecord } from '../types'
import { buildExportPayload, deliverExportFile } from './export'

const records: ScoreRecord[] = [
  {
    id: 'record-1',
    score: 9.5,
    note: '第一次紀錄, 含逗號與"引號"',
    recordedAt: '2026-04-06T08:30:00.000Z',
    createdAt: '2026-04-06T08:31:00.000Z',
  },
]

function createFakeDocument() {
  const link = {
    click: vi.fn(),
    download: '',
    href: '',
    rel: '',
    target: '',
  } as unknown as HTMLAnchorElement

  return {
    document: {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      createElement: vi.fn(() => link),
    } as unknown as Document,
    link,
  }
}

describe('export utilities', () => {
  it('builds a JSON export with metadata', () => {
    const payload = buildExportPayload(records, 'json', new Date('2026-04-06T09:00:00'))

    expect(payload.filename).toBe('score-tracer-export-2026-04-06-0900.json')
    expect(payload.mimeType).toContain('application/json')

    const parsed = JSON.parse(payload.content)
    expect(parsed.recordCount).toBe(1)
    expect(parsed.records[0].note).toBe('第一次紀錄, 含逗號與"引號"')
  })

  it('builds a CSV export with utf-8 bom and escaped fields', () => {
    const payload = buildExportPayload(records, 'csv', new Date('2026-04-06T09:00:00'))

    expect(payload.filename).toBe('score-tracer-export-2026-04-06-0900.csv')
    expect(payload.content.startsWith('\uFEFFid,score,note')).toBe(true)
    expect(payload.content).toContain('"第一次紀錄, 含逗號與""引號"""')
  })

  it('uses the native share sheet on iPhone-compatible browsers', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const payload = buildExportPayload(records, 'json', new Date('2026-04-06T09:00:00.000Z'))

    const result = await deliverExportFile(payload, {
      BlobCtor: Blob,
      FileCtor: File,
      navigator: {
        canShare: vi.fn().mockReturnValue(true),
        share,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      },
    })

    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledTimes(1)
  })

  it('falls back to a standard download on desktop browsers', async () => {
    const { document, link } = createFakeDocument()
    const url = {
      createObjectURL: vi.fn().mockReturnValue('blob:score-tracer'),
      revokeObjectURL: vi.fn(),
    }
    const payload = buildExportPayload(records, 'csv', new Date('2026-04-06T09:00:00.000Z'))

    const result = await deliverExportFile(payload, {
      BlobCtor: Blob,
      document,
      navigator: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      setTimeoutFn: ((callback: TimerHandler) => {
        if (typeof callback === 'function') {
          callback()
        }
        return 0 as unknown as ReturnType<typeof setTimeout>
      }) as unknown as typeof setTimeout,
      url,
    })

    expect(result).toBe('downloaded')
    expect(link.download).toBe(payload.filename)
    expect(link.click).toHaveBeenCalledTimes(1)
    expect(url.revokeObjectURL).toHaveBeenCalledWith('blob:score-tracer')
  })

  it('opens a preview tab on iPhone when file sharing is unavailable', async () => {
    const { document, link } = createFakeDocument()
    const url = {
      createObjectURL: vi.fn().mockReturnValue('blob:score-tracer'),
      revokeObjectURL: vi.fn(),
    }
    const payload = buildExportPayload(records, 'json', new Date('2026-04-06T09:00:00.000Z'))

    const result = await deliverExportFile(payload, {
      BlobCtor: Blob,
      FileCtor: File,
      document,
      navigator: {
        canShare: vi.fn().mockReturnValue(false),
        share: vi.fn(),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      },
      setTimeoutFn: ((callback: TimerHandler) => {
        if (typeof callback === 'function') {
          callback()
        }
        return 0 as unknown as ReturnType<typeof setTimeout>
      }) as unknown as typeof setTimeout,
      url,
    })

    expect(result).toBe('opened')
    expect(link.target).toBe('_blank')
    expect(link.download).toBe('')
    expect(link.click).toHaveBeenCalledTimes(1)
  })
})
