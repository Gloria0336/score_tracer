import type { ScoreSummary } from '../types'

type SummaryCardsProps = {
  summary: ScoreSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: '總筆數', value: summary.total.toString() },
    { label: '平均分', value: summary.total > 0 ? summary.average.toFixed(2) : '--' },
    { label: '最高分', value: summary.total > 0 ? summary.max.toFixed(1) : '--' },
    { label: '最低分', value: summary.total > 0 ? summary.min.toFixed(1) : '--' },
    { label: '最近分數', value: summary.latest !== undefined ? summary.latest.toFixed(1) : '--' },
  ]

  return (
    <div className="summary-grid">
      {cards.map((card) => (
        <article className="summary-card" key={card.label}>
          <p>{card.label}</p>
          <strong>{card.value}</strong>
        </article>
      ))}
    </div>
  )
}
