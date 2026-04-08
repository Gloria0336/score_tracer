import type { ScoreRecord } from '../types'
import { formatDateTime } from '../utils/datetime'
import { getEmotionLabel } from '../utils/emotion'

type RecordListProps = {
  currentPage: number
  records: ScoreRecord[]
  totalCount: number
  totalPages: number
  onPageChange: (page: number) => void
  onSelect: (record: ScoreRecord) => void
}

export function RecordList({
  currentPage,
  records,
  totalCount,
  totalPages,
  onPageChange,
  onSelect,
}: RecordListProps) {
  return (
    <section aria-label="歷史紀錄區" className="panel records-panel">
      <div className="section-heading records-panel__head">
        <div>
          <p className="eyebrow">History</p>
          <h2>歷史紀錄</h2>
          <p className="section-copy">列表只保留關鍵資訊，點開單筆紀錄即可查看備註、編輯或刪除。</p>
        </div>
        <div className="records-meta">
          <strong>{totalCount}</strong>
          <span>總筆數</span>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="empty-records">目前還沒有任何紀錄，先新增一筆分數吧。</div>
      ) : (
        <>
          <div className="record-list">
            {records.map((record) => (
              <article className="record-row" key={record.id}>
                <button className="record-main" type="button" onClick={() => onSelect(record)}>
                  <div className="record-score">{record.score.toFixed(1)}</div>
                  <div className="record-meta">
                    <strong>{formatDateTime(record.recordedAt)}</strong>
                    <div className="record-tags">
                      <span className="record-tag">{getEmotionLabel(record.emotion)}</span>
                      <span className="record-tag record-tag--muted">點選查看詳細內容</span>
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </div>

          <div className="pagination">
            <button
              className="secondary-button"
              disabled={currentPage <= 1}
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
            >
              上一頁
            </button>
            <p className="pagination__status">
              第 {currentPage} / {totalPages} 頁，每頁最多 10 筆
            </p>
            <button
              className="secondary-button"
              disabled={currentPage >= totalPages}
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
            >
              下一頁
            </button>
          </div>
        </>
      )}
    </section>
  )
}
