import type { ScoreRecord } from '../types'
import {
  backupRecordsToGitHub,
  buildGitHubBackupPayload,
  GITHUB_BACKUP_SETTINGS_KEY,
  isGitHubBackupConfigured,
  loadGitHubBackupConfig,
  saveGitHubBackupConfig,
} from './githubBackup'

function createRecord(): ScoreRecord {
  return {
    id: 'record-1',
    score: 9.5,
    emotion: 4,
    note: 'backup test',
    recordedAt: '2026-04-17T10:00:00.000Z',
    createdAt: '2026-04-17T10:01:00.000Z',
  }
}

function createJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

describe('github backup utilities', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads and saves backup settings from localStorage', () => {
    saveGitHubBackupConfig({
      owner: 'gloria0336',
      repo: 'score_tracer',
      branch: 'main',
      path: 'backups/records.json',
      token: 'secret-token',
      autoBackup: true,
    })

    expect(window.localStorage.getItem(GITHUB_BACKUP_SETTINGS_KEY)).toContain('"owner":"gloria0336"')
    expect(loadGitHubBackupConfig()).toEqual({
      owner: 'gloria0336',
      repo: 'score_tracer',
      branch: 'main',
      path: 'backups/records.json',
      token: 'secret-token',
      autoBackup: true,
    })
  })

  it('recognizes when backup settings are complete', () => {
    expect(
      isGitHubBackupConfigured({
        owner: 'gloria0336',
        repo: 'score_tracer',
        branch: 'main',
        path: 'backups/records.json',
        token: 'secret-token',
        autoBackup: false,
      }),
    ).toBe(true)

    expect(
      isGitHubBackupConfigured({
        owner: '',
        repo: 'score_tracer',
        branch: 'main',
        path: 'backups/records.json',
        token: 'secret-token',
        autoBackup: false,
      }),
    ).toBe(false)
  })

  it('builds a full JSON snapshot payload', () => {
    const payload = JSON.parse(buildGitHubBackupPayload([createRecord()], new Date('2026-04-17T10:20:00.000Z')))

    expect(payload).toMatchObject({
      app: 'score-tracer',
      committedAt: '2026-04-17T10:20:00.000Z',
      recordCount: 1,
      schemaVersion: 1,
    })
    expect(payload.records[0].emotion).toBe(4)
  })

  it('updates the configured GitHub backup file', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({ sha: 'old-sha' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          commit: {
            html_url: 'https://github.com/gloria0336/score_tracer/commit/abc123',
          },
          content: {
            sha: 'new-sha',
          },
        }),
      )

    const result = await backupRecordsToGitHub(
      [createRecord()],
      {
        owner: 'gloria0336',
        repo: 'score_tracer',
        branch: 'main',
        path: 'backups/records.json',
        token: 'secret-token',
        autoBackup: true,
      },
      {
        committedAt: new Date('2026-04-17T10:20:00.000Z'),
        trigger: 'manual',
      },
      fetchMock,
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.github.com/repos/gloria0336/score_tracer/contents/backups/records.json?ref=main',
      expect.objectContaining({
        method: 'GET',
      }),
    )

    const putCall = fetchMock.mock.calls[1]
    const putBody = JSON.parse(String(putCall[1]?.body))
    const decodedPayload = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'))

    expect(putBody.sha).toBe('old-sha')
    expect(putBody.message).toContain('manual backup')
    expect(decodedPayload.recordCount).toBe(1)
    expect(result).toEqual({
      commitUrl: 'https://github.com/gloria0336/score_tracer/commit/abc123',
      committedAt: '2026-04-17T10:20:00.000Z',
      path: 'backups/records.json',
      sha: 'new-sha',
    })
  })
})
