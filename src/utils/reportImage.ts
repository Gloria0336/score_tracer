import type {
  DistributionPoint,
  EmotionAveragePoint,
  ScoreRecord,
  ScoreSummary,
  TimePeriodPoint,
  TrendPoint,
} from '../types'
import { formatDateTime } from './datetime'

export type ChartExportKey = 'trend' | 'distribution' | 'emotion' | 'timePeriod'

export type ChartExportDefinition = {
  key: ChartExportKey
  buttonLabel: string
  filenamePrefix: string
  title: string
  subtitle: string
}

type ChartImagePayload = {
  blob: Blob
  filename: string
  mimeType: 'image/jpeg'
}

type BuildChartImageOptions = {
  chart: ChartExportDefinition
  exportedAt?: Date
  source: HTMLElement
}

type BuildReportImageOptions = {
  distributionData: DistributionPoint[]
  emotionAverageData: EmotionAveragePoint[]
  exportedAt?: Date
  records: ScoreRecord[]
  sources: Record<ChartExportKey, HTMLElement | null>
  summary: ScoreSummary
  timePeriodData: TimePeriodPoint[]
  trendData: TrendPoint[]
}

const JPEG_MIME_TYPE = 'image/jpeg' as const
const JPG_QUALITY = 0.92
const CHART_CARD_WIDTH = 1600
const CHART_CARD_HEIGHT = 1040
const A4_WIDTH = 1240
const A4_HEIGHT = 1754

export const CHART_EXPORTS: ChartExportDefinition[] = [
  {
    key: 'trend',
    buttonLabel: '匯出趨勢圖 JPG',
    filenamePrefix: 'trend-chart',
    title: '分數趨勢圖',
    subtitle: '依照記錄時間檢視分數變化，適合快速查看近期波動。',
  },
  {
    key: 'distribution',
    buttonLabel: '匯出分布圖 JPG',
    filenamePrefix: 'distribution-chart',
    title: '分數分布圖',
    subtitle: '查看分數集中在哪些區間，辨識高低分是否過度集中。',
  },
  {
    key: 'emotion',
    buttonLabel: '匯出情緒圖 JPG',
    filenamePrefix: 'emotion-chart',
    title: '情緒平均圖',
    subtitle: '比較不同情緒狀態下的平均分數，觀察感受與表現關聯。',
  },
  {
    key: 'timePeriod',
    buttonLabel: '匯出時段分析 JPG',
    filenamePrefix: 'time-period-chart',
    title: '時段分數分析圖',
    subtitle: '比較早上、下午、晚上與深夜的平均分數與紀錄次數，辨識高分常出現的時段。',
  },
]

export async function buildChartImagePayload({
  chart,
  exportedAt = new Date(),
  source,
}: BuildChartImageOptions): Promise<ChartImagePayload> {
  const svgElement = getChartSvg(source)
  const chartImage = await renderSvgToImage(svgElement)
  const canvas = createCanvas(CHART_CARD_WIDTH, CHART_CARD_HEIGHT)
  const context = getCanvasContext(canvas)
  const timestamp = formatDateTime(exportedAt.toISOString())

  drawPageBackground(context, CHART_CARD_WIDTH, CHART_CARD_HEIGHT)
  drawRoundedCard(context, 48, 44, CHART_CARD_WIDTH - 96, CHART_CARD_HEIGHT - 88, 40, '#fffdfb')
  drawAccent(context, 48, 44, CHART_CARD_WIDTH - 96)
  drawText(context, chart.title, 96, 126, '700 52px "Segoe UI", "Noto Sans TC", sans-serif', '#102033')
  drawWrappedText(
    context,
    chart.subtitle,
    96,
    178,
    CHART_CARD_WIDTH - 192,
    34,
    '400 28px "Segoe UI", "Noto Sans TC", sans-serif',
    '#57667a',
  )
  drawText(
    context,
    `輸出時間 ${timestamp}`,
    96,
    232,
    '600 24px "Segoe UI", "Noto Sans TC", sans-serif',
    '#7b8797',
  )

  const chartFrame = { x: 74, y: 270, width: CHART_CARD_WIDTH - 148, height: CHART_CARD_HEIGHT - 346 }
  drawRoundedCard(context, chartFrame.x, chartFrame.y, chartFrame.width, chartFrame.height, 30, '#f7fafc')
  context.drawImage(chartImage, chartFrame.x + 18, chartFrame.y + 18, chartFrame.width - 36, chartFrame.height - 36)

  drawText(
    context,
    'JPG image optimized for album preview and iPhone sharing.',
    96,
    CHART_CARD_HEIGHT - 64,
    '500 22px "Segoe UI", "Noto Sans TC", sans-serif',
    '#7b8797',
  )

  return {
    blob: await canvasToBlob(canvas, JPEG_MIME_TYPE, JPG_QUALITY),
    filename: `score-tracer-${chart.filenamePrefix}-${formatTimestampForFilename(exportedAt)}.jpg`,
    mimeType: JPEG_MIME_TYPE,
  }
}

export async function buildA4ReportImagePayload({
  distributionData,
  emotionAverageData,
  exportedAt = new Date(),
  records,
  sources,
  summary,
  timePeriodData,
  trendData,
}: BuildReportImageOptions): Promise<ChartImagePayload> {
  const [trendImage, distributionImage, emotionImage, timePeriodImage] = await Promise.all(
    CHART_EXPORTS.map((chart) => {
      const source = sources[chart.key]
      if (!source) {
        throw new Error(`找不到 ${chart.title} 的圖表內容，請稍後再試一次。`)
      }

      return renderSvgToImage(getChartSvg(source))
    }),
  )

  const canvas = createCanvas(A4_WIDTH, A4_HEIGHT)
  const context = getCanvasContext(canvas)
  const timestamp = formatDateTime(exportedAt.toISOString())

  drawPageBackground(context, A4_WIDTH, A4_HEIGHT)
  drawRoundedCard(context, 40, 36, A4_WIDTH - 80, A4_HEIGHT - 72, 42, '#fffdfb')
  drawAccent(context, 40, 36, A4_WIDTH - 80)
  drawText(context, 'Score Tracer A4 圖像報告', 84, 126, '700 54px "Segoe UI", "Noto Sans TC", sans-serif', '#102033')
  drawWrappedText(
    context,
    `共 ${records.length} 筆記錄，整理趨勢、分布、情緒與時段四張分析圖表，輸出為單張直式 A4 JPG，方便手機預覽與分享。`,
    84,
    178,
    A4_WIDTH - 168,
    34,
    '400 28px "Segoe UI", "Noto Sans TC", sans-serif',
    '#57667a',
  )
  drawText(context, `報告時間 ${timestamp}`, 84, 258, '600 24px "Segoe UI", "Noto Sans TC", sans-serif', '#7b8797')

  const stats = [
    { label: '紀錄次數', value: String(summary.total) },
    { label: '平均分數', value: summary.total > 0 ? summary.average.toFixed(2) : '--' },
    { label: '最新分數', value: summary.latest !== undefined ? summary.latest.toFixed(1) : '--' },
    { label: '最高分數', value: summary.total > 0 ? summary.max.toFixed(1) : '--' },
    { label: '最低分數', value: summary.total > 0 ? summary.min.toFixed(1) : '--' },
  ]

  const statY = 314
  const statGap = 14
  const statWidth = (A4_WIDTH - 168 - statGap * 4) / 5
  stats.forEach((stat, index) => {
    const x = 84 + index * (statWidth + statGap)
    drawRoundedCard(context, x, statY, statWidth, 142, 24, index === 0 ? '#16324f' : '#f8fafc')
    drawText(
      context,
      stat.label,
      x + 20,
      statY + 42,
      '600 22px "Segoe UI", "Noto Sans TC", sans-serif',
      index === 0 ? 'rgba(248, 250, 252, 0.8)' : '#57667a',
    )
    drawText(
      context,
      stat.value,
      x + 20,
      statY + 102,
      '700 40px "Segoe UI", "Noto Sans TC", sans-serif',
      index === 0 ? '#ffffff' : '#102033',
    )
  })

  const topChartsY = 490
  const chartGap = 26
  const halfWidth = (A4_WIDTH - 168 - chartGap) / 2

  drawReportChartCard(context, {
    title: `${CHART_EXPORTS[0].title} (${trendData.length} 筆)`,
    subtitle: CHART_EXPORTS[0].subtitle,
    image: trendImage,
    x: 84,
    y: topChartsY,
    width: halfWidth,
    height: 430,
  })
  drawReportChartCard(context, {
    title: `${CHART_EXPORTS[1].title} (${distributionData.length} 區間)`,
    subtitle: CHART_EXPORTS[1].subtitle,
    image: distributionImage,
    x: 84 + halfWidth + chartGap,
    y: topChartsY,
    width: halfWidth,
    height: 430,
  })
  drawReportChartCard(context, {
    title: `${CHART_EXPORTS[2].title} (${emotionAverageData.filter((item) => item.count > 0).length} 組情緒)`,
    subtitle: buildEmotionSummary(emotionAverageData),
    image: emotionImage,
    x: 84,
    y: 950,
    width: halfWidth,
    height: 430,
  })
  drawReportChartCard(context, {
    title: `${CHART_EXPORTS[3].title} (${timePeriodData.filter((item) => item.count > 0).length} 時段)`,
    subtitle: buildTimePeriodSummary(timePeriodData),
    image: timePeriodImage,
    x: 84 + halfWidth + chartGap,
    y: 950,
    width: halfWidth,
    height: 430,
  })

  drawText(
    context,
    buildFooterText(records),
    84,
    A4_HEIGHT - 88,
    '500 22px "Segoe UI", "Noto Sans TC", sans-serif',
    '#7b8797',
  )

  return {
    blob: await canvasToBlob(canvas, JPEG_MIME_TYPE, JPG_QUALITY),
    filename: `score-tracer-a4-report-${formatTimestampForFilename(exportedAt)}.jpg`,
    mimeType: JPEG_MIME_TYPE,
  }
}

function buildEmotionSummary(emotionAverageData: EmotionAveragePoint[]) {
  const strongest = [...emotionAverageData]
    .filter((item) => item.averageScore !== null)
    .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))[0]

  if (!strongest || strongest.averageScore === null) {
    return '目前尚無足夠的情緒資料，持續記錄後就能比較不同情緒下的平均表現。'
  }

  return `${strongest.label} 目前平均 ${strongest.averageScore.toFixed(1)} 分，是表現最高的情緒區間。`
}

function buildTimePeriodSummary(timePeriodData: TimePeriodPoint[]) {
  const strongest = [...timePeriodData]
    .filter((item) => item.averageScore !== null)
    .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))[0]

  if (!strongest || strongest.averageScore === null) {
    return '目前尚無足夠的時段資料，持續記錄後就能看出一天中哪個時段最容易拿高分。'
  }

  return `${strongest.label} (${strongest.range}) 目前平均 ${strongest.averageScore.toFixed(1)} 分，共 ${strongest.count} 次記錄。`
}

function buildFooterText(records: ScoreRecord[]) {
  if (records.length === 0) {
    return '目前沒有任何記錄可供輸出。'
  }

  const latestRecord = [...records].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  )[0]

  return `最新記錄時間 ${formatDateTime(latestRecord.recordedAt)}，本報告為 JPG 單圖輸出，可直接分享至手機相簿或通訊軟體。`
}

function drawReportChartCard(
  context: CanvasRenderingContext2D,
  options: {
    height: number
    image: HTMLImageElement
    subtitle: string
    title: string
    width: number
    x: number
    y: number
  },
) {
  drawRoundedCard(context, options.x, options.y, options.width, options.height, 28, '#ffffff')
  drawText(
    context,
    options.title,
    options.x + 28,
    options.y + 46,
    '700 30px "Segoe UI", "Noto Sans TC", sans-serif',
    '#102033',
  )
  drawWrappedText(
    context,
    options.subtitle,
    options.x + 28,
    options.y + 84,
    options.width - 56,
    28,
    '400 21px "Segoe UI", "Noto Sans TC", sans-serif',
    '#57667a',
  )

  const chartTop = options.y + 132
  const chartHeight = options.height - 156
  drawRoundedCard(context, options.x + 18, chartTop, options.width - 36, chartHeight, 22, '#f7fafc')
  context.drawImage(options.image, options.x + 28, chartTop + 10, options.width - 56, chartHeight - 20)
}

function drawPageBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f6f2ea')
  gradient.addColorStop(0.5, '#eef2f6')
  gradient.addColorStop(1, '#fdf8f2')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  context.fillStyle = 'rgba(217, 72, 95, 0.08)'
  context.beginPath()
  context.arc(width - 110, 120, 160, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = 'rgba(60, 157, 155, 0.1)'
  context.beginPath()
  context.arc(80, height - 120, 180, 0, Math.PI * 2)
  context.fill()
}

function drawAccent(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  const accent = context.createLinearGradient(x, y, x + width, y)
  accent.addColorStop(0, '#d9485f')
  accent.addColorStop(1, '#3c9d9b')
  context.fillStyle = accent
  drawRoundedPath(context, x, y, width, 10, 10)
  context.fill()
}

function drawRoundedCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
) {
  context.save()
  context.shadowColor = 'rgba(22, 50, 79, 0.12)'
  context.shadowBlur = 24
  context.shadowOffsetY = 12
  context.fillStyle = fill
  drawRoundedPath(context, x, y, width, height, radius)
  context.fill()
  context.restore()

  context.strokeStyle = 'rgba(16, 32, 51, 0.06)'
  context.lineWidth = 1
  drawRoundedPath(context, x, y, width, height, radius)
  context.stroke()
}

function drawRoundedPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
) {
  context.font = font
  context.fillStyle = color
  context.textBaseline = 'alphabetic'
  context.fillText(text, x, y)
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  font: string,
  color: string,
) {
  context.font = font
  context.fillStyle = color
  context.textBaseline = 'alphabetic'

  const lines = wrapText(context, text, maxWidth)
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight)
  })
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let currentLine = ''

  for (const character of text) {
    const nextLine = currentLine + character
    if (currentLine && context.measureText(nextLine).width > maxWidth) {
      lines.push(currentLine)
      currentLine = character
    } else {
      currentLine = nextLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function getChartSvg(source: HTMLElement) {
  const svgElement = source.querySelector('svg')
  if (!svgElement) {
    throw new Error('找不到圖表內容，請稍後再試一次。')
  }

  return svgElement
}

async function renderSvgToImage(svgElement: SVGSVGElement) {
  const rect = svgElement.getBoundingClientRect()
  const width = Math.max(Math.round(rect.width), 640)
  const height = Math.max(Math.round(rect.height), 280)
  const clone = svgElement.cloneNode(true) as SVGSVGElement

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }

  const markup = new XMLSerializer().serializeToString(clone)
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`

  return loadImage(dataUrl)
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('圖表圖片轉換失敗，請稍後再試一次。'))
    image.src = source
  })
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('無法建立圖片輸出所需的畫布。')
  }

  return context
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('圖片輸出失敗，請稍後再試一次。'))
        return
      }

      resolve(blob)
    }, type, quality)
  })
}

function formatTimestampForFilename(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}-${hours}${minutes}`
}
