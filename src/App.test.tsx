import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './utils/storage'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function getScoreInput() {
  return document.querySelector('input[type="number"]') as HTMLInputElement
}

function getEmotionSelect() {
  return document.querySelector('select') as HTMLSelectElement
}

function getNoteInput() {
  return document.querySelector('textarea') as HTMLTextAreaElement
}

function getSubmitButton() {
  return document.querySelector('button[type="submit"]') as HTMLButtonElement
}

describe('App', () => {
  it('saves a new record to localStorage', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(getScoreInput(), '8.5')
    await user.selectOptions(getEmotionSelect(), '4')
    await user.type(getNoteInput(), 'backup smoke test')
    await user.click(getSubmitButton())

    const saved = window.localStorage.getItem(STORAGE_KEY)
    expect(saved).toContain('"score":8.5')
    expect(saved).toContain('"emotion":4')
    expect(saved).toContain('backup smoke test')
  })

  it('opens the trend chart detail modal', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'trend-record',
          score: 9,
          emotion: 3,
          note: '',
          recordedAt: '2026-04-07T09:30:00.000Z',
          createdAt: '2026-04-07T09:30:00.000Z',
        },
      ]),
    )

    render(<App />)
    await user.click(screen.getByRole('button', { name: '放大檢視' }))

    expect(screen.getByRole('dialog', { name: '分數趨勢圖放大檢視' })).toBeInTheDocument()
    expect(screen.getByText('時間縮放 140%')).toBeInTheDocument()
  })

  it('loads broken localStorage data safely', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken json')
    render(<App />)

    expect(screen.getByText('Summary and Backup')).toBeInTheDocument()
  })

  it('backs up to GitHub automatically after a new record is added', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          commit: {
            html_url: 'https://github.com/gloria0336/score_tracer/commit/abc123',
          },
          content: {
            sha: 'backup-sha',
          },
        }),
      } as Response)

    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    await user.type(screen.getByLabelText('GitHub Owner'), 'gloria0336')
    await user.type(screen.getByLabelText('Repository'), 'score_tracer')
    await user.clear(screen.getByLabelText('Branch'))
    await user.type(screen.getByLabelText('Branch'), 'main')
    await user.clear(screen.getByLabelText('Backup Path'))
    await user.type(screen.getByLabelText('Backup Path'), 'backups/records.json')
    await user.type(screen.getByLabelText('Personal Access Token'), 'secret-token')
    await user.click(screen.getByLabelText('Auto backup after every data change'))

    await user.type(getScoreInput(), '8')
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    expect(screen.getByText(/Automatic backup saved 1 records to backups\/records\.json/)).toBeInTheDocument()
  })
})
