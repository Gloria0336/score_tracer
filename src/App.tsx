import { useEffect, useMemo, useRef, useState } from 'react'
import { ChartsSection } from './components/ChartsSection'
import { ExportPanel } from './components/ExportPanel'
import { RecordList } from './components/RecordList'
import { RecordModal } from './components/RecordModal'
import { ScoreForm } from './components/ScoreForm'
import { SummaryCards } from './components/SummaryCards'
import type { ScoreRecord, ScoreRecordInput } from './types'
import {
  getDistributionSeries,
  getEmotionAverageSeries,
  getSummary,
  getTrendSeries,
  sortByRecordedAtDesc,
} from './utils/analytics'
import { deliverBinaryExportFile, type ExportDeliveryResult } from './utils/export'
import { parseImportedRecords } from './utils/import'
import {
  buildA4ReportImagePayload,
  buildChartImagePayload,
  CHART_EXPORTS,
  type ChartExportKey,
} from './utils/reportImage'
import { loadRecords, saveRecords } from './utils/storage'

const RECORDS_PER_PAGE = 10

function createRecord(input: ScoreRecordInput): ScoreRecord {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
}

function App() {
  const [records, setRecords] = useState<ScoreRecord[]>(() => sortByRecordedAtDesc(loadRecords()))
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const trendChartRef = useRef<HTMLElement | null>(null)
  const distributionChartRef = useRef<HTMLElement | null>(null)
  const emotionChartRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    saveRecords(records)
  }, [records])

  const summary = useMemo(() => getSummary(records), [records])
  const trendData = useMemo(() => getTrendSeries(records), [records])
  const distributionData = useMemo(() => getDistributionSeries(records), [records])
  const emotionAverageData = useMemo(() => getEmotionAverageSeries(records), [records])
  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) ?? null,
    [records, selectedRecordId],
  )
  const totalPages = Math.max(1, Math.ceil(records.length / RECORDS_PER_PAGE))
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE
    return records.slice(startIndex, startIndex + RECORDS_PER_PAGE)
  }, [currentPage, records])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleAddRecord = (input: ScoreRecordInput) => {
    setRecords((current) => sortByRecordedAtDesc([createRecord(input), ...current]))
    setCurrentPage(1)
  }

  const handleUpdateRecord = (id: string, input: ScoreRecordInput) => {
    setRecords((current) =>
      sortByRecordedAtDesc(
        current.map((record) =>
          record.id === id
            ? {
                ...record,
                ...input,
              }
            : record,
        ),
      ),
    )
  }

  const handleDelete = (id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id))
    setSelectedRecordId((current) => (current === id ? null : current))
  }

  const handleImport = async (content: string, fileName: string) => {
    const { records: importedRecords, skippedCount } = parseImportedRecords(content, fileName)

    setRecords((current) => {
      const existingIds = new Set(current.map((record) => record.id))
      const merged = importedRecords.map((record) => {
        if (!existingIds.has(record.id)) {
          existingIds.add(record.id)
          return record
        }

        const nextId = crypto.randomUUID()
        existingIds.add(nextId)
        return { ...record, id: nextId }
      })

      return sortByRecordedAtDesc([...merged, ...current])
    })
    setCurrentPage(1)

    return {
      importedCount: importedRecords.length,
      skippedCount,
    }
  }

  const handleExportImage = async (target: ChartExportKey | 'report'): Promise<ExportDeliveryResult> => {
    if (target === 'report') {
      const payload = await buildA4ReportImagePayload({
        distributionData,
        emotionAverageData,
        records,
        sources: {
          distribution: distributionChartRef.current,
          emotion: emotionChartRef.current,
          trend: trendChartRef.current,
        },
        summary,
        trendData,
      })

      return deliverBinaryExportFile(payload)
    }

    const chart = CHART_EXPORTS.find((item) => item.key === target)
    const source =
      target === 'trend'
        ? trendChartRef.current
        : target === 'distribution'
          ? distributionChartRef.current
          : emotionChartRef.current

    if (!chart || !source) {
      throw new Error('目前找不到可輸出的圖表，請稍後再試一次。')
    }

    const payload = await buildChartImagePayload({
      chart,
      source,
    })

    return deliverBinaryExportFile(payload)
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Score Tracer</p>
          <h1>追蹤分數、整理圖表、輸出成可分享的視覺報告</h1>
          <p className="hero__copy">
            輸入每次分數與情緒後，系統會自動生成摘要、趨勢圖與 A4 圖像報告，方便後續在手機上快速查看與分享。
          </p>
        </div>
      </header>

      <main className="dashboard">
        <ScoreForm onSubmit={handleAddRecord} />

        <section className="panel insights-panel">
          <div className="section-heading">
            <p className="eyebrow">Snapshot</p>
            <h2>即時摘要</h2>
            <p className="section-copy">
              先看整體紀錄數、平均分數與最新分數，再決定要輸出原始資料、單張圖表，或完整的 A4 圖像報告。
            </p>
          </div>
          <SummaryCards summary={summary} />
          <ExportPanel onExportImage={handleExportImage} records={records} onImport={handleImport} />
        </section>

        <ChartsSection
          distributionChartRef={distributionChartRef}
          distributionData={distributionData}
          emotionAverageData={emotionAverageData}
          emotionChartRef={emotionChartRef}
          trendChartRef={trendChartRef}
          trendData={trendData}
        />
        <RecordList
          currentPage={currentPage}
          records={paginatedRecords}
          totalCount={records.length}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onSelect={(record) => setSelectedRecordId(record.id)}
        />
      </main>

      {selectedRecord ? (
        <RecordModal
          record={selectedRecord}
          onClose={() => setSelectedRecordId(null)}
          onDelete={handleDelete}
          onSave={handleUpdateRecord}
        />
      ) : null}
    </div>
  )
}

export default App
