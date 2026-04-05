import { useEffect, useMemo, useState } from 'react'
import { ChartsSection } from './components/ChartsSection'
import { RecordList } from './components/RecordList'
import { RecordModal } from './components/RecordModal'
import { ScoreForm } from './components/ScoreForm'
import { SummaryCards } from './components/SummaryCards'
import type { ScoreRecord } from './types'
import { getDistributionSeries, getSummary, getTrendSeries, sortByRecordedAtDesc } from './utils/analytics'
import { loadRecords, saveRecords } from './utils/storage'

function createRecord(input: Omit<ScoreRecord, 'id' | 'createdAt'>): ScoreRecord {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
}

function App() {
  const [records, setRecords] = useState<ScoreRecord[]>(() => sortByRecordedAtDesc(loadRecords()))
  const [selectedRecord, setSelectedRecord] = useState<ScoreRecord | null>(null)

  useEffect(() => {
    saveRecords(records)
  }, [records])

  const summary = useMemo(() => getSummary(records), [records])
  const trendData = useMemo(() => getTrendSeries(records), [records])
  const distributionData = useMemo(() => getDistributionSeries(records), [records])

  const handleAddRecord = (input: Omit<ScoreRecord, 'id' | 'createdAt'>) => {
    setRecords((current) => sortByRecordedAtDesc([createRecord(input), ...current]))
  }

  const handleDelete = (id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id))
    setSelectedRecord((current) => (current?.id === id ? null : current))
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Score Tracer</p>
          <h1>把每一次打分，整理成看得懂的趨勢。</h1>
          <p className="hero__copy">
            記錄分數、原因與時間，再用動態圖表快速看出高低起伏、分數分布與最近狀態。
          </p>
        </div>
      </header>

      <main className="dashboard">
        <ScoreForm onSubmit={handleAddRecord} />
        <section className="panel insights-panel">
          <div className="section-heading">
            <p className="eyebrow">Snapshot</p>
            <h2>分數總覽</h2>
            <p className="section-copy">
              用最少的資訊先抓到整體節奏，再往下看圖表與個別紀錄。
            </p>
          </div>
          <SummaryCards summary={summary} />
        </section>
        <ChartsSection distributionData={distributionData} trendData={trendData} />
        <RecordList records={records} onDelete={handleDelete} onSelect={setSelectedRecord} />
      </main>

      {selectedRecord ? (
        <RecordModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      ) : null}
    </div>
  )
}

export default App
