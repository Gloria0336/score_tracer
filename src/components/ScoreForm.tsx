import { useEffect, useState } from 'react'
import type { ScoreRecordInput } from '../types'
import { toDatetimeLocalValue } from '../utils/datetime'
import { EMOTION_OPTIONS, normalizeEmotionLevel } from '../utils/emotion'

type ScoreFormProps = {
  initialValues?: ScoreRecordInput
  mode?: 'panel' | 'compact'
  onCancel?: () => void
  onSubmit: (input: ScoreRecordInput) => void
  submitLabel?: string
}

type FormErrors = {
  score?: string
  recordedAt?: string
}

const defaultValues = (): ScoreRecordInput => ({
  score: 0,
  emotion: 3,
  note: '',
  recordedAt: new Date().toISOString(),
})

function toStateValues(values: ScoreRecordInput) {
  return {
    score: values.score > 0 ? values.score.toString() : '',
    emotion: String(values.emotion),
    note: values.note,
    recordedAt: toDatetimeLocalValue(new Date(values.recordedAt)),
  }
}

export function ScoreForm({
  initialValues,
  mode = 'panel',
  onCancel,
  onSubmit,
  submitLabel = '新增紀錄',
}: ScoreFormProps) {
  const sourceValues = initialValues ?? defaultValues()
  const [score, setScore] = useState(() => toStateValues(sourceValues).score)
  const [emotion, setEmotion] = useState(() => toStateValues(sourceValues).emotion)
  const [note, setNote] = useState(() => toStateValues(sourceValues).note)
  const [recordedAt, setRecordedAt] = useState(() => toStateValues(sourceValues).recordedAt)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const nextValues = toStateValues(initialValues ?? defaultValues())
    setScore(nextValues.score)
    setEmotion(nextValues.emotion)
    setNote(nextValues.note)
    setRecordedAt(nextValues.recordedAt)
    setErrors({})
  }, [initialValues])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    const parsedScore = Number(score)
    const recordedTime = new Date(recordedAt)

    if (score.trim() === '' || Number.isNaN(parsedScore)) {
      nextErrors.score = '請輸入分數。'
    } else if (parsedScore < 0 || parsedScore > 20) {
      nextErrors.score = '分數必須介於 0 到 20 之間。'
    }

    if (!recordedAt || Number.isNaN(recordedTime.getTime())) {
      nextErrors.recordedAt = '請輸入有效的記錄時間。'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({
      score: parsedScore,
      emotion: normalizeEmotionLevel(emotion),
      note: note.trim(),
      recordedAt: recordedTime.toISOString(),
    })

    if (!initialValues) {
      const nextValues = toStateValues(defaultValues())
      setScore(nextValues.score)
      setEmotion(nextValues.emotion)
      setNote(nextValues.note)
      setRecordedAt(nextValues.recordedAt)
      setErrors({})
    }
  }

  const formContent = (
    <form
      className={`score-form ${mode === 'compact' ? 'score-form--compact' : ''}`}
      noValidate
      onSubmit={handleSubmit}
    >
      <label className="field">
        <span>分數</span>
        <input
          aria-label="分數"
          inputMode="decimal"
          max="20"
          min="0"
          placeholder="例如 8.5"
          step="0.1"
          type="number"
          value={score}
          onChange={(event) => setScore(event.target.value)}
        />
        <small>分數範圍為 0 到 20。</small>
        {errors.score ? <strong className="field-error">{errors.score}</strong> : null}
      </label>

      <label className="field">
        <span>心情</span>
        <select aria-label="心情" value={emotion} onChange={(event) => setEmotion(event.target.value)}>
          {EMOTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <small>0 代表情緒最低，5 代表情緒最好。</small>
      </label>

      <label className="field">
        <span>記錄時間</span>
        <input
          aria-label="記錄時間"
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
          placeholder="可選填，記下這次打分的原因或當時狀態。"
          rows={mode === 'compact' ? 3 : 4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <div className="form-actions">
        <button className="primary-button" type="submit">
          {submitLabel}
        </button>
        {onCancel ? (
          <button className="secondary-button" type="button" onClick={onCancel}>
            取消
          </button>
        ) : null}
      </div>
    </form>
  )

  if (mode === 'compact') {
    return formContent
  }

  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <p className="eyebrow">Record Score</p>
        <h2>新增打分紀錄</h2>
        <p className="section-copy">
          每次輸入分數時，同步為當下心情評分，之後就能一起分析情緒與分數的關係。
        </p>
      </div>

      {formContent}
    </section>
  )
}
