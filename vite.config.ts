import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

function withTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveBasePath() {
  const explicitBase = process.env.PAGES_BASE_PATH ?? process.env.VITE_BASE_PATH
  if (explicitBase) {
    const normalized = explicitBase.startsWith('/') ? explicitBase : `/${explicitBase}`
    return withTrailingSlash(normalized)
  }

  if (process.env.GITHUB_ACTIONS === 'true') {
    const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
    if (repositoryName) {
      return `/${repositoryName}/`
    }
  }

  return '/'
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
