import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { STORAGE_KEY } from './utils/storage'

beforeEach(() => {
  window.localStorage.clear()
})

describe('App', () => {
  it('adds a valid record with emotion and updates summary plus list', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('分數'), '8.5')
    await user.selectOptions(screen.getByLabelText('心情'), '4')
    await user.type(screen.getByLabelText('備註'), '今天狀態不錯')
    await user.click(screen.getByRole('button', { name: '新增紀錄' }))
    const historySection = screen.getByLabelText('歷史紀錄區')

    expect(screen.getAllByText('總筆數').length).toBeGreaterThan(0)
    expect(within(historySection).getByText('第 1 / 1 頁，每頁最多 10 筆')).toBeInTheDocument()
    expect(within(historySection).getByText('4 不錯')).toBeInTheDocument()

    const saved = window.localStorage.getItem(STORAGE_KEY)
    expect(saved).toContain('"emotion":4')
  })

  it('shows validation when score is out of range', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('分數'), '21')
    await user.click(screen.getByRole('button', { name: '新增紀錄' }))

    expect(screen.getByText('分數必須介於 0 到 20 之間。')).toBeInTheDocument()
  })

  it('opens modal detail and supports edit plus delete', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('分數'), '9')
    await user.selectOptions(screen.getByLabelText('心情'), '2')
    await user.type(screen.getByLabelText('備註'), '原始備註')
    await user.click(screen.getByRole('button', { name: '新增紀錄' }))

    await user.click(screen.getByRole('button', { name: /點選查看詳細內容/ }))
    let dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('原始備註')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '編輯紀錄' }))
    await user.clear(within(dialog).getByLabelText('分數'))
    await user.type(within(dialog).getByLabelText('分數'), '11')
    await user.selectOptions(within(dialog).getByLabelText('心情'), '5')
    await user.clear(within(dialog).getByLabelText('備註'))
    await user.type(within(dialog).getByLabelText('備註'), '更新後備註')
    await user.click(within(dialog).getByRole('button', { name: '儲存變更' }))

    dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('5 很好')).toBeInTheDocument()
    expect(within(dialog).getByText('更新後備註')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '刪除紀錄' }))
    expect(screen.getByText('目前還沒有任何紀錄，先新增一筆分數吧。')).toBeInTheDocument()
  })

  it('supports pagination with 10 records per page', async () => {
    const user = userEvent.setup()
    render(<App />)
    const historySection = screen.getByLabelText('歷史紀錄區')

    for (let index = 1; index <= 11; index += 1) {
      await user.clear(screen.getByLabelText('分數'))
      await user.type(screen.getByLabelText('分數'), String(index))
      await user.click(screen.getByRole('button', { name: '新增紀錄' }))
    }

    expect(within(historySection).getByText('第 1 / 2 頁，每頁最多 10 筆')).toBeInTheDocument()
    expect(within(historySection).getByText('11.0')).toBeInTheDocument()
    expect(within(historySection).queryByText('1.0')).not.toBeInTheDocument()

    await user.click(within(historySection).getByRole('button', { name: '下一頁' }))
    expect(within(historySection).getByText('第 2 / 2 頁，每頁最多 10 筆')).toBeInTheDocument()
    expect(within(historySection).getByText('1.0')).toBeInTheDocument()
  })

  it('loads broken localStorage data safely', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken json')
    render(<App />)

    expect(screen.getByText('目前還沒有任何紀錄，先新增一筆分數吧。')).toBeInTheDocument()
  })
})
