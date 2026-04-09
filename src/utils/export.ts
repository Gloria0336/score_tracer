import type { ScoreRecord } from '../types'

export type ExportFormat = 'json' | 'csv'

export type ExportPayload = {
  content: string
  filename: string
  mimeType: string
}

export type BinaryExportPayload = {
  blob: Blob
  filename: string
  mimeType: string
}

export type ExportDeliveryResult = 'shared' | 'downloaded' | 'opened' | 'cancelled'

type RuntimeNavigator = Pick<Navigator, 'canShare' | 'share' | 'userAgent' | 'platform' | 'maxTouchPoints'>

type ExportRuntime = {
  BlobCtor?: typeof Blob
  FileCtor?: typeof File
  document?: Document
  navigator?: Partial<RuntimeNavigator>
  setTimeoutFn?: typeof setTimeout
  url?: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>
}

export function buildExportPayload(
  records: ScoreRecord[],
  format: ExportFormat,
  exportedAt = new Date(),
): ExportPayload {
  const timestamp = formatTimestampForFilename(exportedAt)

  if (format === 'json') {
    return {
      content: JSON.stringify(
        {
          exportedAt: exportedAt.toISOString(),
          recordCount: records.length,
          records,
        },
        null,
        2,
      ),
      filename: `score-tracer-export-${timestamp}.json`,
      mimeType: 'application/json;charset=utf-8',
    }
  }

  const header = ['id', 'score', 'emotion', 'note', 'recordedAt', 'createdAt']
  const lines = records.map((record) =>
    [
      escapeCsvValue(record.id),
      escapeCsvValue(record.score),
      escapeCsvValue(record.emotion),
      escapeCsvValue(record.note),
      escapeCsvValue(record.recordedAt),
      escapeCsvValue(record.createdAt),
    ].join(','),
  )

  return {
    content: `\uFEFF${[header.join(','), ...lines].join('\r\n')}`,
    filename: `score-tracer-export-${timestamp}.csv`,
    mimeType: 'text/csv;charset=utf-8',
  }
}

export async function deliverExportFile(
  payload: ExportPayload,
  runtime: ExportRuntime = {},
): Promise<ExportDeliveryResult> {
  const BlobCtor = runtime.BlobCtor ?? Blob
  const blob = new BlobCtor([payload.content], { type: payload.mimeType })

  return deliverPreparedBlob(
    {
      blob,
      filename: payload.filename,
      mimeType: payload.mimeType,
    },
    runtime,
  )
}

export async function deliverBinaryExportFile(
  payload: BinaryExportPayload,
  runtime: ExportRuntime = {},
): Promise<ExportDeliveryResult> {
  return deliverPreparedBlob(payload, runtime)
}

async function deliverPreparedBlob(
  payload: BinaryExportPayload,
  runtime: ExportRuntime,
): Promise<ExportDeliveryResult> {
  const FileCtor = runtime.FileCtor ?? (typeof File !== 'undefined' ? File : undefined)
  const activeNavigator = runtime.navigator ?? (typeof navigator !== 'undefined' ? navigator : undefined)
  const activeDocument = runtime.document ?? (typeof document !== 'undefined' ? document : undefined)
  const activeUrl = runtime.url ?? URL
  const setTimeoutFn = runtime.setTimeoutFn ?? setTimeout
  const preferShareSheet = isAppleMobileDevice(activeNavigator)

  if (preferShareSheet && activeNavigator?.share && FileCtor) {
    const file = new FileCtor([payload.blob], payload.filename, {
      lastModified: Date.now(),
      type: payload.mimeType,
    })
    const shareData = {
      files: [file],
      text: 'Score Tracer export',
      title: 'Score Tracer export',
    }

    const canShareFiles =
      typeof activeNavigator.canShare === 'function' ? activeNavigator.canShare(shareData) : true

    if (canShareFiles) {
      try {
        await activeNavigator.share(shareData)
        return 'shared'
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return 'cancelled'
        }
      }
    }
  }

  if (!activeDocument || !activeUrl?.createObjectURL) {
    return 'cancelled'
  }

  const objectUrl = activeUrl.createObjectURL(payload.blob)
  const link = activeDocument.createElement('a')
  link.href = objectUrl
  link.rel = 'noopener noreferrer'

  if (preferShareSheet) {
    link.target = '_blank'
  } else {
    link.download = payload.filename
  }

  activeDocument.body.appendChild(link)
  link.click()
  activeDocument.body.removeChild(link)

  setTimeoutFn(() => activeUrl.revokeObjectURL(objectUrl), 1000)

  return preferShareSheet ? 'opened' : 'downloaded'
}

function escapeCsvValue(value: string | number): string {
  const text = String(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function formatTimestampForFilename(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}-${hours}${minutes}`
}

function isAppleMobileDevice(activeNavigator?: Partial<RuntimeNavigator>) {
  if (!activeNavigator) {
    return false
  }

  const userAgent = activeNavigator.userAgent ?? ''
  const platform = activeNavigator.platform ?? ''
  const maxTouchPoints = activeNavigator.maxTouchPoints ?? 0

  return /iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}
