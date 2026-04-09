import { useRef, useState } from 'react'
import type { ScoreRecord } from '../types'
import {
  buildExportPayload,
  deliverExportFile,
  type ExportDeliveryResult,
  type ExportFormat,
} from '../utils/export'
import { CHART_EXPORTS, type ChartExportKey } from '../utils/reportImage'

type ExportPanelProps = {
  onExportImage:
    | ((target: ChartExportKey | 'report') => Promise<ExportDeliveryResult>)
    | ((target: ChartExportKey | 'report') => ExportDeliveryResult)
  records: ScoreRecord[]
  onImport: (
    content: string,
    fileName: string,
  ) => Promise<{ importedCount: number; skippedCount: number }> | { importedCount: number; skippedCount: number }
}

const DEFAULT_MESSAGE = '可匯出 JSON、CSV、單張圖表 JPG 與 A4 圖像報告，也支援從 JSON / CSV 匯入。'

export function ExportPanel({ onExportImage, records, onImport }: ExportPanelProps) {
  const [isWorking, setIsWorking] = useState(false)
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const hasRecords = records.length > 0

  const handleExport = async (format: ExportFormat) => {
    if (!hasRecords || isWorking) {
      return
    }

    setIsWorking(true)

    try {
      const payload = buildExportPayload(records, format)
      const result = await deliverExportFile(payload)
      setMessage(describeDeliveryResult(result, format === 'json' ? 'JSON 檔案' : 'CSV 檔案'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '檔案匯出失敗，請稍後再試一次。')
    } finally {
      setIsWorking(false)
    }
  }

  const handleImageExport = async (target: ChartExportKey | 'report') => {
    if (!hasRecords || isWorking) {
      return
    }

    setIsWorking(true)

    try {
      const result = await onExportImage(target)
      setMessage(describeDeliveryResult(result, target === 'report' ? 'A4 報告 JPG' : '圖表 JPG'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '圖片匯出失敗，請稍後再試一次。')
    } finally {
      setIsWorking(false)
    }
  }

  const handleChooseFile = () => {
    if (!isWorking) {
      fileInputRef.current?.click()
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || isWorking) {
      return
    }

    setIsWorking(true)

    try {
      const content = await file.text()
      const result = await onImport(content, file.name)
      setMessage(
        result.skippedCount > 0
          ? `已匯入 ${result.importedCount} 筆資料，略過 ${result.skippedCount} 筆格式不完整的項目。`
          : `已成功匯入 ${result.importedCount} 筆資料。`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '匯入失敗，請確認檔案內容後再試一次。')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <section className="export-block" aria-label="資料匯入與匯出">
      <div>
        <p className="eyebrow">Import / Export</p>
        <h3>資料與報告輸出</h3>
        <p className="helper-copy">
          JSON / CSV 適合備份與整理原始資料，JPG 影像則適合快速分享圖表與 A4 版面報告。
        </p>
      </div>

      <div className="export-actions">
        <button
          className="secondary-button"
          disabled={!hasRecords || isWorking}
          type="button"
          onClick={() => void handleExport('json')}
        >
          匯出 JSON
        </button>
        <button
          className="secondary-button"
          disabled={!hasRecords || isWorking}
          type="button"
          onClick={() => void handleExport('csv')}
        >
          匯出 CSV
        </button>
        <button className="secondary-button" disabled={isWorking} type="button" onClick={handleChooseFile}>
          匯入資料
        </button>
        <input
          ref={fileInputRef}
          accept=".json,.csv,application/json,text/csv"
          className="visually-hidden"
          type="file"
          onChange={(event) => void handleImportFile(event)}
        />
      </div>

      <div className="export-actions export-actions--images">
        {CHART_EXPORTS.map((chart) => (
          <button
            key={chart.key}
            className="secondary-button"
            disabled={!hasRecords || isWorking}
            type="button"
            onClick={() => void handleImageExport(chart.key)}
          >
            {chart.buttonLabel}
          </button>
        ))}
        <button
          className="secondary-button"
          disabled={!hasRecords || isWorking}
          type="button"
          onClick={() => void handleImageExport('report')}
        >
          匯出 A4 報告 JPG
        </button>
      </div>

      <p className="helper-copy export-status" role="status">
        {message}
      </p>
    </section>
  )
}

function describeDeliveryResult(result: ExportDeliveryResult, label: string) {
  if (result === 'shared') {
    return `${label} 已送到系統分享面板，可直接分享到 iPhone 相簿或通訊軟體。`
  }

  if (result === 'opened') {
    return `${label} 已在新分頁開啟，可繼續儲存或分享。`
  }

  if (result === 'downloaded') {
    return `${label} 已開始下載。`
  }

  return `${label} 匯出已取消。`
}
