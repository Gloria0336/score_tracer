import type { ScoreRecord } from '../types'
import { formatDateTime } from '../utils/datetime'

type RecordListProps = {
  records: ScoreRecord[]
  onSelect: (record: ScoreRecord) => void
  onDelete: (id: string) => void
}

function summarizeNote(note: string): string {
  return note.length > 42 ? `${note.slice(0, 42)}...` : note
}

export function RecordList({ records, onSelect, onDelete }: RecordListProps) {
  return (
    <section className="panel records-panel">
      <div className="section-heading">
        <p className="eyebrow">History</p>
        <h2>打分紀錄</h2>
        <p className="section-copy">
          每筆紀錄都保留分數、時間與備註摘要，點擊即可查看完整內容。
        </p>
      </div>

      {records.length === 0 ? (
        <div className="empty-records">目前沒有任何紀錄，先從上方表單新增第一筆吧。</div>
      ) : (
        <div className="record-list">
          {records.map((record) => (
            <article className="record-row" key={record.id}>
              <button className="record-main" type="button" onClick={() => onSelect(record)}>
                <div className="record-score">{record.score.toFixed(1)}</div>
                <div className="record-meta">
                  <strong>{formatDateTime(record.recordedAt)}</strong>
                  <p>{summarizeNote(record.note)}</p>
                </div>
              </button>

              <button
                aria-label={`刪除 ${record.score.toFixed(1)} 分紀錄`}
                className="danger-button"
                type="button"
                onClick={() => onDelete(record.id)}
              >
                刪除
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
