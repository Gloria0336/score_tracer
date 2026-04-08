import { useState } from 'react'
import type { ScoreRecord, ScoreRecordInput } from '../types'
import { formatDateTime } from '../utils/datetime'
import { getEmotionLabel } from '../utils/emotion'
import { ScoreForm } from './ScoreForm'

type RecordModalProps = {
  record: ScoreRecord
  onClose: () => void
  onDelete: (id: string) => void
  onSave: (id: string, input: ScoreRecordInput) => void
}

export function RecordModal({ record, onClose, onDelete, onSave }: RecordModalProps) {
  const [isEditing, setIsEditing] = useState(false)

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
            <p className="eyebrow">{isEditing ? 'Edit Record' : 'Record Detail'}</p>
            <h3>{record.score.toFixed(1)} 分</h3>
          </div>
          <button aria-label="關閉視窗" className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        {isEditing ? (
          <ScoreForm
            initialValues={{
              score: record.score,
              emotion: record.emotion,
              note: record.note,
              recordedAt: record.recordedAt,
            }}
            mode="compact"
            submitLabel="儲存變更"
            onCancel={() => setIsEditing(false)}
            onSubmit={(input) => {
              onSave(record.id, input)
              setIsEditing(false)
            }}
          />
        ) : (
          <>
            <dl className="record-detail-grid">
              <div>
                <dt>心情分級</dt>
                <dd>{getEmotionLabel(record.emotion)}</dd>
              </div>
              <div>
                <dt>記錄時間</dt>
                <dd>{formatDateTime(record.recordedAt)}</dd>
              </div>
              <div>
                <dt>建立時間</dt>
                <dd>{formatDateTime(record.createdAt)}</dd>
              </div>
            </dl>

            <div className="note-block">
              <p>備註</p>
              <pre>{record.note || '未填寫備註'}</pre>
            </div>

            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={() => setIsEditing(true)}>
                編輯紀錄
              </button>
              <button className="danger-button" type="button" onClick={() => onDelete(record.id)}>
                刪除紀錄
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
