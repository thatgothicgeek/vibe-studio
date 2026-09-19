import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function loadHubToken() {
  const environmentToken = process.env.VIBE_HUB_SYNC_TOKEN?.trim()

  if (environmentToken) return environmentToken

  try {
    const secretFile = join(
      homedir(),
      '.config/vibe/hub-sync.env',
    )

    const content = readFileSync(secretFile, 'utf8')
    const match = content.match(
      /^VIBE_HUB_SYNC_TOKEN=(.+)$/m,
    )

    return match?.[1]?.trim() || ''
  } catch {
    return ''
  }
}

export default defineConfig(({ command }) => {
  const hubToken = loadHubToken()

  if (command === 'serve' && !hubToken) {
    throw new Error(
      'Vibe Hub token is unavailable to the Studio dev proxy.',
    )
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'https://hub.thegeek.guide',
          changeOrigin: true,
          secure: true,
          headers: hubToken
            ? {
                Authorization: `Bearer ${hubToken}`,
              }
            : {},
        },
      },
    },
  }
})
