import { useEffect, useMemo, useRef, useState } from 'react'
import { ChartsSection } from './components/ChartsSection'
import { ExportPanel } from './components/ExportPanel'
import { RecordList } from './components/RecordList'
import { RecordModal } from './components/RecordModal'
import { ScoreForm } from './components/ScoreForm'
import { SummaryCards } from './components/SummaryCards'
import { TrendChartModal } from './components/TrendChartModal'
import type { ScoreRecord, ScoreRecordInput } from './types'
import {
  getDistributionSeries,
  getEmotionAverageSeries,
  getSummary,
  getTimePeriodSeries,
  getTrendSeries,
  sortByRecordedAtDesc,
} from './utils/analytics'
import { deliverBinaryExportFile, type ExportDeliveryResult } from './utils/export'
import {
  backupRecordsToGitHub,
  loadGitHubBackupConfig,
  saveGitHubBackupConfig,
  type GitHubBackupConfig,
  type GitHubBackupTrigger,
} from './utils/githubBackup'
import { parseImportedRecords } from './utils/import'
import {
  buildA4ReportImagePayload,
  buildChartImagePayload,
  CHART_EXPORTS,
  type ChartExportKey,
} from './utils/reportImage'
import { loadRecords, saveRecords } from './utils/storage'

const RECORDS_PER_PAGE = 10

type BackupStatusTone = 'idle' | 'working' | 'success' | 'error'

type BackupStatus = {
  commitUrl?: string
  message: string
  tone: BackupStatusTone
}

const DEFAULT_BACKUP_STATUS: BackupStatus = {
  message: 'Fill in the GitHub backup settings to enable manual backup and automatic sync after changes.',
  tone: 'idle',
}

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
  const [isTrendDetailOpen, setIsTrendDetailOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [backupConfig, setBackupConfig] = useState<GitHubBackupConfig>(() => loadGitHubBackupConfig())
  const [backupStatus, setBackupStatus] = useState<BackupStatus>(DEFAULT_BACKUP_STATUS)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const trendChartRef = useRef<HTMLElement | null>(null)
  const distributionChartRef = useRef<HTMLElement | null>(null)
  const emotionChartRef = useRef<HTMLElement | null>(null)
  const timePeriodChartRef = useRef<HTMLElement | null>(null)
  const recordsRef = useRef(records)
  const backupConfigRef = useRef(backupConfig)
  const hasHydratedRecordsRef = useRef(false)
  const backupInFlightRef = useRef(false)
  const queuedBackupTriggerRef = useRef<GitHubBackupTrigger | null>(null)

  const summary = useMemo(() => getSummary(records), [records])
  const trendData = useMemo(() => getTrendSeries(records), [records])
  const distributionData = useMemo(() => getDistributionSeries(records), [records])
  const emotionAverageData = useMemo(() => getEmotionAverageSeries(records), [records])
  const timePeriodData = useMemo(() => getTimePeriodSeries(records), [records])
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
    recordsRef.current = records
  }, [records])

  useEffect(() => {
    backupConfigRef.current = backupConfig
    saveGitHubBackupConfig(backupConfig)
  }, [backupConfig])

  useEffect(() => {
    saveRecords(records)

    if (!hasHydratedRecordsRef.current) {
      hasHydratedRecordsRef.current = true
      return
    }

    if (backupConfig.autoBackup) {
      queueGitHubBackup('auto')
    }
  }, [backupConfig.autoBackup, records])

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
          timePeriod: timePeriodChartRef.current,
          trend: trendChartRef.current,
        },
        summary,
        timePeriodData,
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
          : target === 'emotion'
            ? emotionChartRef.current
            : timePeriodChartRef.current

    if (!chart || !source) {
      throw new Error('The selected chart could not be exported.')
    }

    const payload = await buildChartImagePayload({
      chart,
      source,
    })

    return deliverBinaryExportFile(payload)
  }

  function queueGitHubBackup(trigger: GitHubBackupTrigger) {
    if (backupInFlightRef.current) {
      queuedBackupTriggerRef.current = trigger === 'manual' ? 'manual' : queuedBackupTriggerRef.current ?? 'auto'
      setBackupStatus({
        message: 'A backup is already running. The newest data will be synced again after it finishes.',
        tone: 'working',
      })
      return
    }

    void runGitHubBackup(trigger)
  }

  async function runGitHubBackup(trigger: GitHubBackupTrigger) {
    backupInFlightRef.current = true
    setIsBackingUp(true)
    setBackupStatus({
      message:
        trigger === 'manual'
          ? 'Running manual backup to GitHub...'
          : 'Detected data changes. Running automatic backup to GitHub...',
      tone: 'working',
    })

    try {
      const result = await backupRecordsToGitHub(recordsRef.current, backupConfigRef.current, { trigger })
      const timestamp = new Date(result.committedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })

      setBackupStatus({
        commitUrl: result.commitUrl,
        message: `Automatic backup saved ${recordsRef.current.length} records to ${result.path} at ${timestamp}.`,
        tone: 'success',
      })

      if (trigger === 'manual') {
        setBackupStatus({
          commitUrl: result.commitUrl,
          message: `Manual backup saved ${recordsRef.current.length} records to ${result.path} at ${timestamp}.`,
          tone: 'success',
        })
      }
    } catch (error) {
      setBackupStatus({
        message: error instanceof Error ? error.message : 'GitHub backup failed.',
        tone: 'error',
      })
    } finally {
      backupInFlightRef.current = false
      setIsBackingUp(false)

      const queuedTrigger = queuedBackupTriggerRef.current
      queuedBackupTriggerRef.current = null

      if (queuedTrigger) {
        void runGitHubBackup(queuedTrigger)
      }
    }
  }

  const handleManualBackup = () => {
    queueGitHubBackup('manual')
  }

  const handleBackupConfigChange = (patch: Partial<GitHubBackupConfig>) => {
    setBackupConfig((current) => ({
      ...current,
      ...patch,
    }))
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Score Tracer</p>
          <h1>Track every score and keep every record backed up to GitHub.</h1>
          <p className="hero__copy">
            The app still supports local tracking, charts, and exports, and now it can also sync the full data set to a
            JSON backup file in your GitHub repository.
          </p>
        </div>
      </header>

      <main className="dashboard">
        <ScoreForm onSubmit={handleAddRecord} />

        <section className="panel insights-panel">
          <div className="section-heading">
            <p className="eyebrow">Snapshot</p>
            <h2>Summary and Backup</h2>
            <p className="section-copy">
              Review the current data, export files, import backups, and configure GitHub sync for both manual and
              automatic backup.
            </p>
          </div>
          <SummaryCards summary={summary} />
          <ExportPanel
            backupConfig={backupConfig}
            backupStatusCommitUrl={backupStatus.commitUrl}
            backupStatusMessage={backupStatus.message}
            backupStatusTone={backupStatus.tone}
            isBackingUp={isBackingUp}
            onBackupConfigChange={handleBackupConfigChange}
            onExportImage={handleExportImage}
            onImport={handleImport}
            onManualBackup={handleManualBackup}
            records={records}
          />
        </section>

        <ChartsSection
          distributionChartRef={distributionChartRef}
          distributionData={distributionData}
          emotionAverageData={emotionAverageData}
          emotionChartRef={emotionChartRef}
          onOpenTrendDetail={() => setIsTrendDetailOpen(true)}
          timePeriodChartRef={timePeriodChartRef}
          timePeriodData={timePeriodData}
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

      {isTrendDetailOpen && trendData.length > 0 ? (
        <TrendChartModal
          data={trendData}
          subtitle="左右滑動查看不同時間範圍，並可用縮放調整檢視比例。"
          title="分數趨勢圖"
          onClose={() => setIsTrendDetailOpen(false)}
        />
      ) : null}
    </div>
  )
}

export default App
