import { useState } from 'react'
import { toDatetimeLocalValue } from '../utils/datetime'

type ScoreFormProps = {
  onSubmit: (input: { score: number; note: string; recordedAt: string }) => void
}

type FormErrors = {
  score?: string
  note?: string
  recordedAt?: string
}

const initialTime = () => toDatetimeLocalValue(new Date())

export function ScoreForm({ onSubmit }: ScoreFormProps) {
  const [score, setScore] = useState('')
  const [note, setNote] = useState('')
  const [recordedAt, setRecordedAt] = useState(initialTime)
  const [errors, setErrors] = useState<FormErrors>({})

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    const parsedScore = Number(score)
    const trimmedNote = note.trim()
    const recordedTime = new Date(recordedAt)

    if (score.trim() === '' || Number.isNaN(parsedScore)) {
      nextErrors.score = '請輸入有效分數'
    } else if (parsedScore < 0 || parsedScore > 20) {
      nextErrors.score = '分數必須介於 0 到 20 之間'
    }

    if (trimmedNote.length === 0) {
      nextErrors.note = '請輸入備註'
    }

    if (!recordedAt || Number.isNaN(recordedTime.getTime())) {
      nextErrors.recordedAt = '請輸入有效日期時間'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({
      score: parsedScore,
      note: trimmedNote,
      recordedAt: recordedTime.toISOString(),
    })

    setScore('')
    setNote('')
    setRecordedAt(initialTime())
    setErrors({})
  }

  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <p className="eyebrow">Record Score</p>
        <h2>建立新的打分紀錄</h2>
        <p className="section-copy">
          輸入分數、備註與時間，送出後會立刻更新圖表與歷史清單。
        </p>
      </div>

      <form className="score-form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>分數</span>
          <input
            aria-label="分數"
            inputMode="decimal"
            min="0"
            max="20"
            step="0.1"
            placeholder="例如 8.5"
            type="number"
            value={score}
            onChange={(event) => setScore(event.target.value)}
          />
          <small>一般滿分 10，可輸入到 20。</small>
          {errors.score ? <strong className="field-error">{errors.score}</strong> : null}
        </label>

        <label className="field">
          <span>紀錄時間</span>
          <input
            aria-label="紀錄時間"
            type="datetime-local"
            value={recordedAt}
            onChange={(event) => setRecordedAt(event.target.value)}
          />
          {errors.recordedAt ? (
            <strong className="field-error">{errors.recordedAt}</strong>
          ) : null}
        </label>

        <label className="field">
          <span>備註</span>
          <textarea
            aria-label="備註"
            placeholder="記下這次分數的原因、狀態或重點"
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          {errors.note ? <strong className="field-error">{errors.note}</strong> : null}
        </label>

        <button className="primary-button" type="submit">
          新增紀錄
        </button>
      </form>
    </section>
  )
}
