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
import type { DistributionPoint, EmotionAveragePoint, TrendPoint } from '../types'
import { formatDateTime } from '../utils/datetime'

type ChartsSectionProps = {
  trendData: TrendPoint[]
  distributionData: DistributionPoint[]
  emotionAverageData: EmotionAveragePoint[]
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

export function ChartsSection({
  trendData,
  distributionData,
  emotionAverageData,
}: ChartsSectionProps) {
  const hasEmotionData = emotionAverageData.some((item) => item.count > 0)

  return (
    <section className="panel charts-panel">
      <div className="section-heading">
        <p className="eyebrow">Analytics</p>
        <h2>分數與情緒分析</h2>
        <p className="section-copy">
          透過趨勢、分數分布與情緒分級平均分數三種圖表，快速看出你的記錄模式。
        </p>
      </div>

      <div className="charts-grid charts-grid--triple">
        <article className="chart-card">
          <div className="chart-card__head">
            <h3>分數趨勢</h3>
            <p>依記錄時間排序，觀察分數隨時間的高低變化。</p>
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
            <div className="empty-chart">尚無紀錄，新增第一筆後就能看到分數趨勢。</div>
          )}
        </article>

        <article className="chart-card">
          <div className="chart-card__head">
            <h3>分數分布</h3>
            <p>把分數四捨五入後統計筆數，了解常見分數落點。</p>
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
            <div className="empty-chart">尚未累積足夠紀錄，這裡會顯示各分數區間的筆數。</div>
          )}
        </article>

        <article className="chart-card">
          <div className="chart-card__head">
            <h3>情緒與分數關係</h3>
            <p>比較每個情緒分級下的平均打分，查看心情與表現之間的關聯。</p>
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
                        ? `${payload[0].payload.label}，共 ${payload[0].payload.count} 筆`
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
            <div className="empty-chart">先新增幾筆含心情分級的紀錄，這裡就會顯示各情緒分級的平均分數。</div>
          )}
        </article>
      </div>
    </section>
  )
}
