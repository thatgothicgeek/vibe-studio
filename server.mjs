import { fileURLToPath } from 'node:url'
import { access } from 'node:fs/promises'
import { createStudioServer } from './server/app.mjs'
import { createPasswordAuth } from './server/auth.mjs'

const dist = fileURLToPath(new URL('./dist/', import.meta.url))
const port = Number(process.env.PORT || 3000)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Invalid PORT')
}

await access(new URL('./dist/index.html', import.meta.url))

const server = createStudioServer({
  dist,
  hubToken: process.env.STUDIO_HUB_READ_TOKEN?.trim(),
  auth: createPasswordAuth(process.env),
})

server.requestTimeout = 15000
server.headersTimeout = 10000

server.listen(port, '0.0.0.0', () => {
  console.log(`Studio listening on port ${port}`)
})

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10000).unref()
  })
}
