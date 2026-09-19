import { createServer } from 'node:http'
import { readFile, realpath, stat } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { renderLoginPage } from './login-page.mjs'

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}

const readRoute = path =>
  ['/api/dashboard', '/api/health', '/api/signals'].includes(path) ||
  /^\/api\/signals\/[^/]+$/.test(path)

async function readPassword(request) {
  const contentType = request.headers['content-type'] || ''

  if (
    !contentType
      .toLowerCase()
      .startsWith('application/x-www-form-urlencoded')
  ) {
    return ''
  }

  const chunks = []
  let size = 0

  for await (const chunk of request) {
    size += chunk.length

    if (size > 8192) {
      return ''
    }

    chunks.push(chunk)
  }

  const body = Buffer.concat(chunks).toString('utf8')
  const params = new URLSearchParams(body)

  return params.get('password') || ''
}

export function createStudioServer({
  dist,
  hubToken,
  auth,
  fetchHub = fetch,
  timeoutMs = 10000,
}) {
  if (
    !hubToken ||
    /[\r\n]/.test(hubToken) ||
    !auth ||
    typeof auth.isAuthenticated !== 'function' ||
    typeof auth.attemptLogin !== 'function' ||
    typeof auth.clearSessionCookie !== 'function'
  ) {
    throw new Error('Studio server configuration is incomplete.')
  }

  const root = resolve(dist)

  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'same-origin')
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-ancestors 'none'",
      ].join('; '),
    )

    const json = (status, body, extraHeaders = {}) => {
      response.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        ...extraHeaders,
      })
      response.end(JSON.stringify(body))
    }

    const html = (status, body, extraHeaders = {}) => {
      response.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        ...extraHeaders,
      })
      response.end(body)
    }

    try {
      const rawPath = (request.url || '/').split('?')[0]

      if (!rawPath.startsWith('/') || rawPath.startsWith('//')) {
        return json(400, { error: 'Invalid path' })
      }

      let path

      try {
        path = decodeURIComponent(rawPath)
      } catch {
        return json(400, { error: 'Invalid path' })
      }

      if (
        path.includes('\\') ||
        path.includes('\0') ||
        path.split('/').some(part => part.startsWith('.'))
      ) {
        return json(404, { error: 'Not found' })
      }

      if (path === '/healthz' && request.method === 'GET') {
        return json(200, { status: 'ok' })
      }

      if (
        path === '/studio/login' &&
        (request.method === 'GET' || request.method === 'HEAD')
      ) {
        if (auth.isAuthenticated(request)) {
          response.writeHead(302, { Location: '/studio' })
          return response.end()
        }

        const body = renderLoginPage()

        response.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
        })

        return response.end(
          request.method === 'HEAD' ? undefined : body,
        )
      }

      if (
        path === '/studio/login' &&
        request.method === 'POST'
      ) {
        const password = await readPassword(request)
        const result = await auth.attemptLogin(request, password)

        if (result.ok) {
          response.writeHead(303, {
            Location: '/studio',
            'Set-Cookie': result.setCookie,
          })

          return response.end()
        }

        const headers = {}

        if (result.retryAfter) {
          headers['Retry-After'] = String(result.retryAfter)
        }

        return html(
          result.retryAfter ? 429 : 401,
          renderLoginPage({ error: true }),
          headers,
        )
      }

      if (
        path === '/studio/logout' &&
        request.method === 'POST'
      ) {
        response.writeHead(303, {
          Location: '/studio/login',
          'Set-Cookie': auth.clearSessionCookie(),
        })

        return response.end()
      }

      if (!auth.isAuthenticated(request)) {
        if (path === '/api' || path.startsWith('/api/')) {
          return json(401, { error: 'Authentication required' })
        }

        response.writeHead(302, {
          Location: '/studio/login',
        })

        return response.end()
      }

      if (!['GET', 'HEAD'].includes(request.method)) {
        response.setHeader('Allow', 'GET, HEAD')
        return json(405, { error: 'Read-only service' })
      }

      if (path === '/api' || path.startsWith('/api/')) {
        if (!readRoute(path)) {
          return json(404, { error: 'Not found' })
        }

        const url = new URL(
          request.url,
          'https://hub.thegeek.guide',
        )

        if (url.origin !== 'https://hub.thegeek.guide') {
          return json(400, { error: 'Invalid path' })
        }

        const upstream = await fetchHub(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${hubToken}`,
            Accept: 'application/json',
          },
          redirect: 'error',
          signal: AbortSignal.timeout(timeoutMs),
        })

        if (!upstream.ok) {
          await upstream.body?.cancel()

          return json(
            [400, 404, 429].includes(upstream.status)
              ? upstream.status
              : 502,
            { error: 'Hub request unavailable' },
          )
        }

        if (
          !upstream.headers
            .get('content-type')
            ?.includes('application/json')
        ) {
          await upstream.body?.cancel()

          return json(502, {
            error: 'Hub response unavailable',
          })
        }

        const chunks = []
        let size = 0

        for await (const chunk of upstream.body) {
          size += chunk.length

          if (size > 8 * 1024 * 1024) {
            throw new Error('Response too large')
          }

          chunks.push(chunk)
        }

        const body = Buffer.concat(chunks).toString('utf8')

        JSON.parse(body)

        if (body.includes(hubToken)) {
          throw new Error('Invalid upstream response')
        }

        response.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
        })

        return response.end(
          request.method === 'HEAD' ? undefined : body,
        )
      }

      if (path === '/') {
        response.writeHead(302, {
          Location: '/studio',
        })

        return response.end()
      }

      const relative =
        path === '/studio' || path.startsWith('/studio/')
          ? 'index.html'
          : path.slice(1)

      const candidate = resolve(root, relative)

      if (!candidate.startsWith(root + sep)) {
        return json(404, { error: 'Not found' })
      }

      let file

      try {
        file = await realpath(candidate)

        if (
          !file.startsWith((await realpath(root)) + sep) ||
          !(await stat(file)).isFile()
        ) {
          return json(404, { error: 'Not found' })
        }
      } catch {
        return json(404, { error: 'Not found' })
      }

      const body = await readFile(file)

      response.writeHead(200, {
        'Content-Type':
          mime[extname(file)] || 'application/octet-stream',
      })

      response.end(
        request.method === 'HEAD' ? undefined : body,
      )
    } catch {
      if (!response.headersSent) {
        json(502, {
          error: 'Service temporarily unavailable',
        })
      } else {
        response.destroy()
      }
    }
  })
}
