import { readFileSync } from 'node:fs'
import process from 'node:process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function readTokenFile(relativePath, key) {
  try {
    const content = readFileSync(
      join(homedir(), relativePath),
      'utf8',
    )
    const match = content.match(
      new RegExp(`^${key}=(.+)$`, 'm'),
    )

    return match?.[1]?.trim() || ''
  } catch {
    return ''
  }
}

function loadHubToken() {
  return (
    process.env.STUDIO_HUB_READ_TOKEN?.trim() ||
    process.env.VIBE_HUB_SYNC_TOKEN?.trim() ||
    readTokenFile(
      '.config/vibe/studio-read.env',
      'STUDIO_READ_TOKEN',
    ) ||
    readTokenFile(
      '.config/vibe/hub-sync.env',
      'VIBE_HUB_SYNC_TOKEN',
    )
  )
}

function loadActionToken() {
  return (
    process.env.STUDIO_HUB_ACTION_TOKEN?.trim() ||
    readTokenFile(
      '.config/vibe/studio-action.env',
      'STUDIO_ACTION_TOKEN',
    )
  )
}

export default defineConfig(({ command }) => {
  const hubToken = command === 'serve' ? loadHubToken() : ''
  const actionToken = command === 'serve' ? loadActionToken() : ''

  if (command === 'serve' && !hubToken) {
    throw new Error(
      'Vibe Hub token is unavailable to the Studio dev proxy.',
    )
  }

  return {
    plugins: [react()],
    server: {
      allowedHosts: [
        'jamess-mac-mini.taila7026b.ts.net',
      ],
      proxy: {
        '/api': {
          target: 'https://hub.thegeek.guide',
          changeOrigin: true,
          secure: true,
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq, req) => {
              const isRefreshAction =
                req.method === 'POST' &&
                req.url?.startsWith('/api/actions/refresh')

              const token = isRefreshAction
                ? actionToken
                : hubToken

              if (token) {
                proxyReq.setHeader(
                  'Authorization',
                  `Bearer ${token}`,
                )
              }
            })
          },
        },
      },
    },
  }
})
