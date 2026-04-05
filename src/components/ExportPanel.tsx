import { useState } from 'react'
import type { ScoreRecord } from '../types'
import { buildExportPayload, type ExportFormat, deliverExportFile } from '../utils/export'

type ExportPanelProps = {
  records: ScoreRecord[]
}

export function ExportPanel({ records }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [message, setMessage] = useState('iPhone 會優先開啟分享視窗，你可以直接存到「檔案」。')

  const hasRecords = records.length > 0

  const handleExport = async (format: ExportFormat) => {
    if (!hasRecords || isExporting) {
      return
    }

    setIsExporting(true)

    try {
      const payload = buildExportPayload(records, format)
      const result = await deliverExportFile(payload)

      if (result === 'shared') {
        setMessage('已開啟分享視窗，請選擇「儲存到檔案」或其他目標。')
        return
      }

      if (result === 'opened') {
        setMessage('已開啟匯出預覽頁，請使用 Safari 的分享按鈕儲存到「檔案」。')
        return
      }

      if (result === 'downloaded') {
        setMessage('匯出檔案已開始下載。')
        return
      }

      setMessage('已取消匯出。')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="export-block" aria-label="匯出資料">
      <div>
        <p className="eyebrow">Export</p>
        <h3>輸出全部資料</h3>
        <p className="helper-copy">
          可匯出目前所有分數紀錄、備註與時間。JSON 適合完整備份，CSV 適合 Excel、Numbers 或表格分析。
        </p>
      </div>

      <div className="export-actions">
        <button
          className="secondary-button"
          disabled={!hasRecords || isExporting}
          type="button"
          onClick={() => void handleExport('json')}
        >
          匯出 JSON
        </button>
        <button
          className="secondary-button"
          disabled={!hasRecords || isExporting}
          type="button"
          onClick={() => void handleExport('csv')}
        >
          匯出 CSV
        </button>
      </div>

      <p className="helper-copy export-status" role="status">
        {hasRecords ? message : '目前沒有資料可匯出，新增紀錄後就能下載或分享到 iPhone 檔案 App。'}
      </p>
    </section>
  )
}
