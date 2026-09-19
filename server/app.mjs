import { createServer } from 'node:http'
import { readFile, realpath, stat } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const readRoute = path => ['/api/dashboard', '/api/health', '/api/signals'].includes(path) || /^\/api\/signals\/[^/]+$/.test(path)

export function createStudioServer({ dist, hubToken, authorize, fetchHub = fetch, timeoutMs = 10000 }) {
  if (!hubToken || /[\r\n]/.test(hubToken) || typeof authorize !== 'function') throw new Error('Studio server configuration is incomplete.')
  const root = resolve(dist)
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'same-origin')
    response.setHeader('X-Frame-Options', 'DENY')
    const json = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify(body))
    }
    try {
      const rawPath = (request.url || '/').split('?')[0]
      if (!rawPath.startsWith('/') || rawPath.startsWith('//')) return json(400, { error: 'Invalid path' })
      let path
      try { path = decodeURIComponent(rawPath) } catch { return json(400, { error: 'Invalid path' }) }
      if (path.includes('\\') || path.includes('\0') || path.split('/').some(x => x.startsWith('.'))) return json(404, { error: 'Not found' })
      if (path === '/healthz' && request.method === 'GET') return json(200, { status: 'ok' })
      if (!await authorize(request)) return json(401, { error: 'Sign in through Studio to continue.' })
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.setHeader('Allow', 'GET, HEAD')
        return json(405, { error: 'Read-only service' })
      }
      if (path === '/api' || path.startsWith('/api/')) {
        if (!readRoute(path)) return json(404, { error: 'Not found' })
        const url = new URL(request.url, 'https://hub.thegeek.guide')
        if (url.origin !== 'https://hub.thegeek.guide') return json(400, { error: 'Invalid path' })
        const upstream = await fetchHub(url, {
          method: 'GET',
          headers: { Authorization: `Bearer ${hubToken}`, Accept: 'application/json' },
          redirect: 'error',
          signal: AbortSignal.timeout(timeoutMs),
        })
        if (!upstream.ok) {
          await upstream.body?.cancel()
          return json([400, 404, 429].includes(upstream.status) ? upstream.status : 502, { error: 'Hub request unavailable' })
        }
        if (!upstream.headers.get('content-type')?.includes('application/json')) {
          await upstream.body?.cancel()
          return json(502, { error: 'Hub response unavailable' })
        }
        const chunks = []
        let size = 0
        for await (const chunk of upstream.body) {
          size += chunk.length
          if (size > 8 * 1024 * 1024) throw new Error('Response too large')
          chunks.push(chunk)
        }
        const body = Buffer.concat(chunks).toString('utf8')
        JSON.parse(body)
        // Never relay an upstream response that accidentally contains the credential.
        if (body.includes(hubToken)) throw new Error('Invalid upstream response')
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        return response.end(request.method === 'HEAD' ? undefined : body)
      }
      if (path === '/') {
        response.writeHead(302, { Location: '/studio' })
        return response.end()
      }
      const relative = path === '/studio' || path.startsWith('/studio/') ? 'index.html' : path.slice(1)
      const candidate = resolve(root, relative)
      if (!candidate.startsWith(root + sep)) return json(404, { error: 'Not found' })
      let file
      try {
        file = await realpath(candidate)
        if (!file.startsWith(await realpath(root) + sep) || !(await stat(file)).isFile()) return json(404, { error: 'Not found' })
      } catch { return json(404, { error: 'Not found' }) }
      const body = await readFile(file)
      response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' })
      response.end(request.method === 'HEAD' ? undefined : body)
    } catch {
      // Deliberately omit error details: upstream errors can contain private data.
      if (!response.headersSent) json(502, { error: 'Service temporarily unavailable' })
      else response.destroy()
    }
  })
}
