import { useRef, useState } from 'react'
import type { ScoreRecord } from '../types'
import {
  buildExportPayload,
  deliverExportFile,
  type ExportDeliveryResult,
  type ExportFormat,
} from '../utils/export'
import { isGitHubBackupConfigured, type GitHubBackupConfig } from '../utils/githubBackup'
import { CHART_EXPORTS, type ChartExportKey } from '../utils/reportImage'

type ExportPanelProps = {
  backupConfig: GitHubBackupConfig
  backupStatusCommitUrl?: string
  backupStatusMessage: string
  backupStatusTone: 'idle' | 'working' | 'success' | 'error'
  isBackingUp: boolean
  onBackupConfigChange: (patch: Partial<GitHubBackupConfig>) => void
  onExportImage:
    | ((target: ChartExportKey | 'report') => Promise<ExportDeliveryResult>)
    | ((target: ChartExportKey | 'report') => ExportDeliveryResult)
  onImport: (
    content: string,
    fileName: string,
  ) => Promise<{ importedCount: number; skippedCount: number }> | { importedCount: number; skippedCount: number }
  onManualBackup: () => void
  records: ScoreRecord[]
}

const DEFAULT_MESSAGE = 'Use JSON or CSV export and import, or save chart images and the A4 report as JPG.'

export function ExportPanel({
  backupConfig,
  backupStatusCommitUrl,
  backupStatusMessage,
  backupStatusTone,
  isBackingUp,
  onBackupConfigChange,
  onExportImage,
  onImport,
  onManualBackup,
  records,
}: ExportPanelProps) {
  const [isWorking, setIsWorking] = useState(false)
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const personalAccessTokenHintId = 'github-token-hint'

  const hasRecords = records.length > 0
  const backupReady = isGitHubBackupConfigured(backupConfig)

  const handleExport = async (format: ExportFormat) => {
    if (!hasRecords || isWorking) {
      return
    }

    setIsWorking(true)

    try {
      const payload = buildExportPayload(records, format)
      const result = await deliverExportFile(payload)
      setMessage(describeDeliveryResult(result, format === 'json' ? 'JSON file' : 'CSV file'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Export failed.')
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
      setMessage(describeDeliveryResult(result, target === 'report' ? 'A4 report JPG' : 'Chart JPG'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Image export failed.')
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
          ? `Imported ${result.importedCount} records and skipped ${result.skippedCount} invalid rows.`
          : `Imported ${result.importedCount} records successfully.`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import failed.')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="export-stack">
      <section className="export-block" aria-label="import-export">
        <div>
          <p className="eyebrow">Import / Export</p>
          <h3>Save and restore your data</h3>
          <p className="helper-copy">
            Export JSON or CSV, import an earlier backup, or save the charts and report as image files.
          </p>
        </div>

        <div className="export-actions">
          <button
            className="secondary-button"
            disabled={!hasRecords || isWorking}
            type="button"
            onClick={() => void handleExport('json')}
          >
            Export JSON
          </button>
          <button
            className="secondary-button"
            disabled={!hasRecords || isWorking}
            type="button"
            onClick={() => void handleExport('csv')}
          >
            Export CSV
          </button>
          <button className="secondary-button" disabled={isWorking} type="button" onClick={handleChooseFile}>
            Import file
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
            Export A4 report JPG
          </button>
        </div>

        <p className="helper-copy export-status" role="status">
          {message}
        </p>
      </section>

      <section className="export-block" aria-label="github-backup">
        <div>
          <p className="eyebrow">GitHub Backup</p>
          <h3>Sync the full data set to GitHub</h3>
          <p className="helper-copy">
            The app writes all records into one JSON file in your repository. The Personal Access Token is stored only
            in this browser localStorage.
          </p>
        </div>

        <div className="backup-grid">
          <label className="field field--compact">
            <span>GitHub Owner</span>
            <input
              autoComplete="off"
              placeholder="gloria0336"
              type="text"
              value={backupConfig.owner}
              onChange={(event) => onBackupConfigChange({ owner: event.target.value })}
            />
          </label>

          <label className="field field--compact">
            <span>Repository</span>
            <input
              autoComplete="off"
              placeholder="score_tracer"
              type="text"
              value={backupConfig.repo}
              onChange={(event) => onBackupConfigChange({ repo: event.target.value })}
            />
          </label>

          <label className="field field--compact">
            <span>Branch</span>
            <input
              autoComplete="off"
              placeholder="main"
              type="text"
              value={backupConfig.branch}
              onChange={(event) => onBackupConfigChange({ branch: event.target.value })}
            />
          </label>

          <label className="field field--compact">
            <span>Backup Path</span>
            <input
              autoComplete="off"
              placeholder="backups/score-tracer-records.json"
              type="text"
              value={backupConfig.path}
              onChange={(event) => onBackupConfigChange({ path: event.target.value })}
            />
          </label>

          <div className="field backup-grid__full">
            <label htmlFor="github-personal-access-token">
              <span>Personal Access Token</span>
            </label>
            <input
              id="github-personal-access-token"
              aria-describedby={personalAccessTokenHintId}
              autoComplete="off"
              placeholder="github_pat_..."
              type="password"
              value={backupConfig.token}
              onChange={(event) => onBackupConfigChange({ token: event.target.value })}
            />
            <small id={personalAccessTokenHintId}>Use a token with repository contents write permission.</small>
          </div>
        </div>

        <label className="backup-toggle">
          <input
            checked={backupConfig.autoBackup}
            type="checkbox"
            onChange={(event) => onBackupConfigChange({ autoBackup: event.target.checked })}
          />
          <span>Auto backup after every data change</span>
        </label>

        <div className="export-actions">
          <button className="primary-button" disabled={isBackingUp} type="button" onClick={onManualBackup}>
            {isBackingUp ? 'Backing up...' : 'Backup to GitHub now'}
          </button>
          <span className={`backup-badge ${backupReady ? 'backup-badge--ready' : 'backup-badge--pending'}`}>
            {backupReady ? 'Ready to sync' : 'Setup required'}
          </span>
        </div>

        <p className={`helper-copy export-status backup-status backup-status--${backupStatusTone}`} role="status">
          {backupStatusMessage}
        </p>

        {backupStatusCommitUrl ? (
          <p className="helper-copy backup-link">
            <a href={backupStatusCommitUrl} rel="noreferrer" target="_blank">
              View the GitHub commit
            </a>
          </p>
        ) : null}
      </section>
    </div>
  )
}

function describeDeliveryResult(result: ExportDeliveryResult, label: string) {
  if (result === 'shared') {
    return `${label} was shared.`
  }

  if (result === 'opened') {
    return `${label} was opened in a new tab.`
  }

  if (result === 'downloaded') {
    return `${label} was downloaded.`
  }

  return `${label} export was cancelled.`
}
