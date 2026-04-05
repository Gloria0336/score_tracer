import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DistributionPoint, TrendPoint } from '../types'
import { formatDateTime } from '../utils/datetime'

type ChartsSectionProps = {
  trendData: TrendPoint[]
  distributionData: DistributionPoint[]
}

function extractTooltipNumber(value: string | number | readonly (string | number)[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value
  return Number(normalized ?? 0)
}

function formatScoreTooltip(value: string | number | readonly (string | number)[] | undefined) {
  return [`${extractTooltipNumber(value).toFixed(1)} 分`, '分數'] as [string, string]
}

function formatCountTooltip(value: string | number | readonly (string | number)[] | undefined) {
  return [`${extractTooltipNumber(value)} 筆`, '紀錄數'] as [string, string]
}

export function ChartsSection({ trendData, distributionData }: ChartsSectionProps) {
  return (
    <section className="panel charts-panel">
      <div className="section-heading">
        <p className="eyebrow">Analytics</p>
        <h2>分數趨勢與分布</h2>
        <p className="section-copy">
          從時間變化與高低分分布兩個角度觀察你的紀錄狀態。
        </p>
      </div>

      <div className="charts-grid">
        <article className="chart-card">
          <div className="chart-card__head">
            <h3>時間趨勢</h3>
            <p>依紀錄時間排序，觀察每次打分的起伏。</p>
          </div>
          {trendData.length > 0 ? (
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} margin={{ top: 12, right: 18, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(17, 24, 39, 0.08)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 20]} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={formatScoreTooltip}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.recordedAt
                        ? formatDateTime(payload[0].payload.recordedAt)
                        : ''
                    }
                  />
                  <Line
                    dataKey="score"
                    stroke="#D9485F"
                    strokeWidth={3}
                    dot={{ fill: '#16324F', r: 4 }}
                    activeDot={{ r: 6 }}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">還沒有資料，新增第一筆分數後就會看到趨勢。</div>
          )}
        </article>

        <article className="chart-card">
          <div className="chart-card__head">
            <h3>分數分布</h3>
            <p>小數分數會先四捨五入後再統計到整數區間。</p>
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
            <div className="empty-chart">分布圖會在你累積資料後顯示各分數區間的筆數。</div>
          )}
        </article>
      </div>
    </section>
  )
}
