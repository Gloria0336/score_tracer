import { useEffect, useMemo, useRef, useState } from 'react'
import type { TrendPoint } from '../types'
import { TrendChart, getTrendZoomDomain } from './TrendChart'

const MIN_HORIZONTAL_ZOOM = 100
const MAX_HORIZONTAL_ZOOM = 320
const MIN_SCORE_ZOOM = 100
const MAX_SCORE_ZOOM = 260
const SCROLL_STEP_RATIO = 0.72

type TrendChartModalProps = {
  data: TrendPoint[]
  subtitle: string
  title: string
  onClose: () => void
}

export function TrendChartModal({
  data,
  subtitle,
  title,
  onClose,
}: TrendChartModalProps) {
  const [horizontalZoom, setHorizontalZoom] = useState(140)
  const [scoreZoom, setScoreZoom] = useState(100)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const chartWidth = useMemo(() => {
    const baseWidth = Math.max(960, data.length * 54)
    return Math.round(baseWidth * (horizontalZoom / 100))
  }, [data.length, horizontalZoom])

  const yDomain = useMemo(() => getTrendZoomDomain(data, scoreZoom), [data, scoreZoom])

  const scrollByDirection = (direction: -1 | 1) => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    viewport.scrollBy({
      left: viewport.clientWidth * SCROLL_STEP_RATIO * direction,
      behavior: 'smooth',
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        aria-modal="true"
        className="modal-card modal-card--wide trend-modal"
        role="dialog"
        aria-label="分數趨勢圖放大檢視"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">Trend Explorer</p>
            <h3>{title}</h3>
            <p className="helper-copy trend-modal__subtitle">{subtitle}</p>
          </div>
          <button aria-label="關閉趨勢圖" className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="trend-modal__controls">
          <label className="trend-control">
            <span>時間縮放 {horizontalZoom}%</span>
            <input
              max={MAX_HORIZONTAL_ZOOM}
              min={MIN_HORIZONTAL_ZOOM}
              step={10}
              type="range"
              value={horizontalZoom}
              onChange={(event) => setHorizontalZoom(Number(event.target.value))}
            />
          </label>

          <label className="trend-control">
            <span>分數縮放 {scoreZoom}%</span>
            <input
              max={MAX_SCORE_ZOOM}
              min={MIN_SCORE_ZOOM}
              step={10}
              type="range"
              value={scoreZoom}
              onChange={(event) => setScoreZoom(Number(event.target.value))}
            />
          </label>

          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setHorizontalZoom(140)
              setScoreZoom(100)

              const viewport = viewportRef.current
              if (viewport) {
                viewport.scrollTo({ left: 0, behavior: 'smooth' })
              }
            }}
          >
            重設檢視
          </button>
        </div>

        <div className="trend-modal__nav">
          <button className="secondary-button" type="button" onClick={() => scrollByDirection(-1)}>
            向左滑動
          </button>
          <button className="secondary-button" type="button" onClick={() => scrollByDirection(1)}>
            向右滑動
          </button>
          <p className="helper-copy">
            可直接拖曳下方圖表，或在觸控裝置上左右滑動來查看不同時段。
          </p>
        </div>

        <div
          ref={viewportRef}
          className="trend-modal__viewport"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              scrollByDirection(-1)
            }

            if (event.key === 'ArrowRight') {
              event.preventDefault()
              scrollByDirection(1)
            }
          }}
        >
          <div className="trend-modal__canvas" style={{ width: `${chartWidth}px` }}>
            <TrendChart
              data={data}
              height={420}
              minTickGap={42}
              showDotsThreshold={48}
              width={chartWidth}
              yDomain={yDomain}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
