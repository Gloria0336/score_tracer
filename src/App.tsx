import { useEffect, useMemo, useState } from 'react'
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
import { parseImportedRecords } from './utils/import'
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

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Score Tracer</p>
          <h1>記錄分數，也一起記住當下心情</h1>
          <p className="hero__copy">
            追蹤每一次打分、回看情緒變化，並用圖表整理趨勢、分布與不同情緒分級下的平均表現。
          </p>
        </div>
      </header>

      <main className="dashboard">
        <ScoreForm onSubmit={handleAddRecord} />

        <section className="panel insights-panel">
          <div className="section-heading">
            <p className="eyebrow">Snapshot</p>
            <h2>目前概況</h2>
            <p className="section-copy">
              快速查看總筆數、平均、最高、最低與最近一次分數，並可匯出或匯入紀錄。
            </p>
          </div>
          <SummaryCards summary={summary} />
          <ExportPanel records={records} onImport={handleImport} />
        </section>

        <ChartsSection
          distributionData={distributionData}
          emotionAverageData={emotionAverageData}
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
