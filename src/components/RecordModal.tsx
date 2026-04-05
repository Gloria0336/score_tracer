import type { ScoreRecord } from '../types'
import { formatDateTime } from '../utils/datetime'

type RecordModalProps = {
  record: ScoreRecord
  onClose: () => void
}

export function RecordModal({ record, onClose }: RecordModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        aria-modal="true"
        className="modal-card"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">Record Detail</p>
            <h3>{record.score.toFixed(1)} 分</h3>
          </div>
          <button
            aria-label="關閉備註視窗"
            className="icon-button"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <dl className="record-detail-grid">
          <div>
            <dt>紀錄時間</dt>
            <dd>{formatDateTime(record.recordedAt)}</dd>
          </div>
          <div>
            <dt>建立時間</dt>
            <dd>{formatDateTime(record.createdAt)}</dd>
          </div>
        </dl>

        <div className="note-block">
          <p>完整備註</p>
          <pre>{record.note}</pre>
        </div>
      </div>
    </div>
  )
}
