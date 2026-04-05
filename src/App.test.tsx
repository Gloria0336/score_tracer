import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { STORAGE_KEY } from './utils/storage'

beforeEach(() => {
  window.localStorage.clear()
})

describe('App', () => {
  it('adds a valid record and updates summary plus list', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('分數'), '8.5')
    await user.type(screen.getByLabelText('備註'), '今天表現穩定')
    await user.click(screen.getByRole('button', { name: '新增紀錄' }))

    expect(screen.getByText('總筆數')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('今天表現穩定')).toBeInTheDocument()

    const saved = window.localStorage.getItem(STORAGE_KEY)
    expect(saved).toContain('今天表現穩定')
  })

  it('shows validation when score is out of range', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('分數'), '21')
    await user.type(screen.getByLabelText('備註'), '超出範圍')
    await user.click(screen.getByRole('button', { name: '新增紀錄' }))

    expect(screen.getByText('分數必須介於 0 到 20 之間')).toBeInTheDocument()
  })

  it('opens modal detail and supports delete', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('分數'), '9')
    await user.type(screen.getByLabelText('備註'), '完整備註內容會顯示在視窗中')
    await user.click(screen.getByRole('button', { name: '新增紀錄' }))

    await user.click(screen.getByRole('button', { name: /完整備註內容會顯示在視窗中/ }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('完整備註內容會顯示在視窗中')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '關閉備註視窗' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /刪除 9.0 分紀錄/ }))
    expect(screen.getByText('目前沒有任何紀錄，先從上方表單新增第一筆吧。')).toBeInTheDocument()
  })

  it('loads broken localStorage data safely', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken json')
    render(<App />)

    expect(screen.getByText('目前沒有任何紀錄，先從上方表單新增第一筆吧。')).toBeInTheDocument()
  })
})
