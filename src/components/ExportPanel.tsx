import { useRef, useState } from 'react'
import type { ScoreRecord } from '../types'
import { buildExportPayload, type ExportFormat, deliverExportFile } from '../utils/export'

type ExportPanelProps = {
  records: ScoreRecord[]
  onImport: (
    content: string,
    fileName: string,
  ) => Promise<{ importedCount: number; skippedCount: number }> | { importedCount: number; skippedCount: number }
}

export function ExportPanel({ records, onImport }: ExportPanelProps) {
  const [isWorking, setIsWorking] = useState(false)
  const [message, setMessage] = useState('可匯出為 JSON 或 CSV，也可匯入先前備份的紀錄檔。')
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

      if (result === 'shared') {
        setMessage('已開啟系統分享視窗，你可以把檔案存到其他 App。')
        return
      }

      if (result === 'opened') {
        setMessage('已開啟檔案預覽頁面，請再從瀏覽器內另存檔案。')
        return
      }

      if (result === 'downloaded') {
        setMessage('檔案已成功匯出。')
        return
      }

      setMessage('匯出已取消。')
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
          ? `已匯入 ${result.importedCount} 筆，略過 ${result.skippedCount} 筆格式不正確的資料。`
          : `已成功匯入 ${result.importedCount} 筆紀錄。`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '匯入失敗，請確認檔案格式是否正確。')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <section className="export-block" aria-label="資料匯入與匯出">
      <div>
        <p className="eyebrow">Import / Export</p>
        <h3>管理資料</h3>
        <p className="helper-copy">
          JSON 適合完整備份與還原，CSV 適合用 Excel、Numbers 或其他表格工具查看。
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
          匯入紀錄
        </button>
        <input
          ref={fileInputRef}
          accept=".json,.csv,application/json,text/csv"
          className="visually-hidden"
          type="file"
          onChange={(event) => void handleImportFile(event)}
        />
      </div>

      <p className="helper-copy export-status" role="status">
        {message}
      </p>
    </section>
  )
}
