import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TrendPoint } from '../types'
import { formatDateTime } from '../utils/datetime'

const DEFAULT_DOT_THRESHOLD = 24
const DEFAULT_SCORE_DOMAIN: [number, number] = [0, 20]

type TrendChartProps = {
  data: TrendPoint[]
  height: number
  minTickGap?: number
  showDotsThreshold?: number
  width?: number
  yDomain?: [number, number]
}

function extractTooltipNumber(value: string | number | readonly (string | number)[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value
  return Number(normalized ?? 0)
}

function formatScoreTooltip(value: string | number | readonly (string | number)[] | undefined) {
  return [`${extractTooltipNumber(value).toFixed(1)} 分`, '分數'] as [string, string]
}

function formatTrendAxisTick(value: string | number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return ''
  }

  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

export function getTrendZoomDomain(
  data: TrendPoint[],
  scoreZoomPercent: number,
): [number, number] {
  if (data.length === 0 || scoreZoomPercent <= 100) {
    return DEFAULT_SCORE_DOMAIN
  }

  const scores = data.map((point) => point.score)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const center = (minScore + maxScore) / 2
  const paddedSpan = Math.max(maxScore - minScore, 2) + 2
  const zoomRatio = scoreZoomPercent / 100
  const visibleSpan = Math.max(paddedSpan / zoomRatio, 1.5)
  let domainMin = center - visibleSpan / 2
  let domainMax = center + visibleSpan / 2

  if (domainMin < DEFAULT_SCORE_DOMAIN[0]) {
    domainMax += DEFAULT_SCORE_DOMAIN[0] - domainMin
    domainMin = DEFAULT_SCORE_DOMAIN[0]
  }

  if (domainMax > DEFAULT_SCORE_DOMAIN[1]) {
    domainMin -= domainMax - DEFAULT_SCORE_DOMAIN[1]
    domainMax = DEFAULT_SCORE_DOMAIN[1]
  }

  return [
    Math.max(DEFAULT_SCORE_DOMAIN[0], Number(domainMin.toFixed(2))),
    Math.min(DEFAULT_SCORE_DOMAIN[1], Number(domainMax.toFixed(2))),
  ]
}

function TrendChartBody({
  data,
  height,
  minTickGap = 28,
  showDotsThreshold = DEFAULT_DOT_THRESHOLD,
  width,
  yDomain = DEFAULT_SCORE_DOMAIN,
}: TrendChartProps) {
  const densityFactor = width ? Math.max(1, width / 960) : 1
  const showTrendDots = data.length <= Math.round(showDotsThreshold * densityFactor)

  return (
    <LineChart
      data={data}
      height={height}
      margin={{ top: 12, right: 18, left: -12, bottom: 0 }}
      width={width}
    >
      <CartesianGrid stroke="rgba(17, 24, 39, 0.08)" vertical={false} />
      <XAxis
        dataKey="timestamp"
        domain={['dataMin', 'dataMax']}
        minTickGap={minTickGap}
        tickFormatter={formatTrendAxisTick}
        tickLine={false}
        axisLine={false}
        type="number"
      />
      <YAxis domain={yDomain} tickLine={false} axisLine={false} />
      <Tooltip
        formatter={formatScoreTooltip}
        labelFormatter={(_, payload) =>
          payload?.[0]?.payload?.recordedAt ? formatDateTime(payload[0].payload.recordedAt) : ''
        }
      />
      <Line
        dataKey="score"
        stroke="#D9485F"
        strokeWidth={3}
        dot={showTrendDots ? { fill: '#16324F', r: 4 } : false}
        activeDot={{ r: 6 }}
        type="linear"
      />
    </LineChart>
  )
}

export function TrendChart(props: TrendChartProps) {
  if (props.width) {
    return <TrendChartBody {...props} />
  }

  return (
    <ResponsiveContainer height={props.height} width="100%">
      <TrendChartBody {...props} />
    </ResponsiveContainer>
  )
}
