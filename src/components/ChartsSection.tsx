import type { RefObject } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import type { DistributionPoint, EmotionAveragePoint, TimePeriodPoint, TrendPoint } from '../types'
import { CHART_EXPORTS } from '../utils/reportImage'
import { TrendChart } from './TrendChart'

type ChartsSectionProps = {
  distributionChartRef: RefObject<HTMLElement | null>
  distributionData: DistributionPoint[]
  emotionAverageData: EmotionAveragePoint[]
  emotionChartRef: RefObject<HTMLElement | null>
  onOpenTrendDetail: () => void
  timePeriodChartRef: RefObject<HTMLElement | null>
  timePeriodData: TimePeriodPoint[]
  trendChartRef: RefObject<HTMLElement | null>
  trendData: TrendPoint[]
}

function extractTooltipNumber(value: string | number | readonly (string | number)[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value
  return Number(normalized ?? 0)
}

function formatScoreTooltip(value: string | number | readonly (string | number)[] | undefined) {
  return [`${extractTooltipNumber(value).toFixed(1)} 分`, '分數'] as [string, string]
}

function formatCountTooltip(value: string | number | readonly (string | number)[] | undefined) {
  return [`${extractTooltipNumber(value)} 次`, '紀錄次數'] as [string, string]
}

function formatEmotionTooltip(
  value: string | number | readonly (string | number)[] | undefined,
  _: string | number | undefined,
  payload?: { payload?: EmotionAveragePoint },
) {
  if (payload?.payload?.averageScore === null) {
    return ['尚無資料', '平均分數'] as [string, string]
  }

  return [`${extractTooltipNumber(value).toFixed(1)} 分`, '平均分數'] as [string, string]
}

function formatTimePeriodTooltip(
  value: string | number | readonly (string | number)[] | undefined,
  name: string | number | undefined,
  payload?: { payload?: TimePeriodPoint },
) {
  if (name === 'averageScore') {
    if (payload?.payload?.averageScore === null) {
      return ['尚無資料', '平均分數'] as [string, string]
    }

    return [`${extractTooltipNumber(value).toFixed(1)} 分`, '平均分數'] as [string, string]
  }

  return [`${extractTooltipNumber(value)} 次`, '紀錄次數'] as [string, string]
}

export function ChartsSection({
  distributionChartRef,
  distributionData,
  emotionAverageData,
  emotionChartRef,
  onOpenTrendDetail,
  timePeriodChartRef,
  timePeriodData,
  trendChartRef,
  trendData,
}: ChartsSectionProps) {
  const hasEmotionData = emotionAverageData.some((item) => item.count > 0)
  const hasTimePeriodData = timePeriodData.some((item) => item.count > 0)
  const [trendMeta, distributionMeta, emotionMeta] = CHART_EXPORTS

  return (
    <section className="panel charts-panel">
      <div className="section-heading">
        <p className="eyebrow">Analytics</p>
        <h2>分析圖表</h2>
        <p className="section-copy">
          這裡會把每次分數紀錄轉成趨勢、分布、情緒平均與時段分析，方便快速比較不同情境下的表現。
        </p>
      </div>

      <div className="charts-grid">
        <article className="chart-card" ref={trendChartRef}>
          <div className="chart-card__head">
            <div>
              <h3>{trendMeta.title}</h3>
              <p>{trendMeta.subtitle}</p>
            </div>
            {trendData.length > 0 ? (
              <button
                aria-label="放大檢視"
                className="secondary-button"
                type="button"
                onClick={onOpenTrendDetail}
              >
                放大檢視
              </button>
            ) : null}
          </div>
          {trendData.length > 0 ? (
            <div className="chart-shell">
              <TrendChart data={trendData} height={280} />
            </div>
          ) : (
            <div className="empty-chart">尚未有足夠資料可建立趨勢圖。</div>
          )}
        </article>

        <article className="chart-card" ref={distributionChartRef}>
          <div className="chart-card__head">
            <h3>{distributionMeta.title}</h3>
            <p>{distributionMeta.subtitle}</p>
          </div>
          {distributionData.length > 0 ? (
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={distributionData} margin={{ top: 12, right: 18, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(17, 24, 39, 0.08)" vertical={false} />
                  <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip formatter={formatCountTooltip} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                    {distributionData.map((item, index) => (
                      <Cell
                        key={`${item.bucket}-${index}`}
                        fill={index % 2 === 0 ? '#16324F' : '#3C9D9B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">至少需要一筆分數資料才能建立分布圖。</div>
          )}
        </article>

        <article className="chart-card" ref={emotionChartRef}>
          <div className="chart-card__head">
            <h3>{emotionMeta.title}</h3>
            <p>{emotionMeta.subtitle}</p>
          </div>
          {hasEmotionData ? (
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={emotionAverageData} margin={{ top: 12, right: 18, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(17, 24, 39, 0.08)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 20]} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={formatEmotionTooltip}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload
                        ? `${payload[0].payload.label}，共 ${payload[0].payload.count} 次`
                        : ''
                    }
                  />
                  <Bar dataKey="averageScore" radius={[10, 10, 0, 0]}>
                    {emotionAverageData.map((item) => (
                      <Cell
                        key={item.emotion}
                        fill={item.averageScore === null ? 'rgba(16, 32, 51, 0.16)' : '#D9485F'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">至少需要一筆含情緒資料的紀錄才能建立情緒平均圖。</div>
          )}
        </article>

        <article className="chart-card" ref={timePeriodChartRef}>
          <div className="chart-card__head">
            <h3>時段分數分析</h3>
            <p>比較早上、下午、晚上與深夜四個時段的平均分數與紀錄次數。</p>
          </div>
          {hasTimePeriodData ? (
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={timePeriodData} margin={{ top: 12, right: 18, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(17, 24, 39, 0.08)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="score"
                    domain={[0, 20]}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="count"
                    orientation="right"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={formatTimePeriodTooltip}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload
                        ? `${payload[0].payload.label} (${payload[0].payload.range})`
                        : ''
                    }
                  />
                  <Bar yAxisId="count" dataKey="count" radius={[10, 10, 0, 0]} fill="#3C9D9B" />
                  <Line
                    yAxisId="score"
                    dataKey="averageScore"
                    stroke="#D9485F"
                    strokeWidth={3}
                    dot={{ fill: '#16324F', r: 4 }}
                    activeDot={{ r: 6 }}
                    type="monotone"
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">至少需要一筆分數資料才能建立時段分析。</div>
          )}
        </article>
      </div>
    </section>
  )
}
