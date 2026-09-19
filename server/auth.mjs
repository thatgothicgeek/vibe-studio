import { createHmac, timingSafeEqual } from 'node:crypto'
import argon2 from 'argon2'

const COOKIE_NAME = 'vibe_studio_session'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000
const MAX_FAILURE_ENTRIES = 500

function safeEqual(left, right) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

function sign(secret, payload) {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('base64url')
}

function cookieValue(request) {
  const header = request.headers.cookie

  if (typeof header !== 'string') return ''

  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')

    if (name === COOKIE_NAME) {
      return rest.join('=')
    }
  }

  return ''
}

function clientKey(request) {
  const forwarded = request.headers['x-forwarded-for']

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers['x-real-ip']

  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim()
  }

  return request.socket?.remoteAddress || 'unknown'
}

export function createPasswordAuth(env, options = {}) {
  const passwordHash = env.STUDIO_PASSWORD_HASH?.trim()
  const sessionSecret = env.STUDIO_SESSION_SECRET?.trim()

  if (!passwordHash?.startsWith('$argon2id$')) {
    throw new Error(
      'Configure STUDIO_PASSWORD_HASH with an Argon2id password hash before starting Studio.',
    )
  }

  if (!sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
    throw new Error(
      'Configure STUDIO_SESSION_SECRET with at least 32 bytes before starting Studio.',
    )
  }

  const now = options.now ?? (() => Date.now())
  const verifyPassword =
    options.verifyPassword ??
    ((hash, password) => argon2.verify(hash, password))

  const failures = new Map()

  function issueSessionCookie() {
    const issuedAt = now()
    const payload = Buffer.from(
      JSON.stringify({
        version: 1,
        issued_at: issuedAt,
        expires_at: issuedAt + SESSION_TTL_MS,
      }),
    ).toString('base64url')

    const signature = sign(sessionSecret, payload)
    const token = `${payload}.${signature}`

    return [
      `${COOKIE_NAME}=${token}`,
      'Path=/',
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
    ].join('; ')
  }

  function clearSessionCookie() {
    return [
      `${COOKIE_NAME}=`,
      'Path=/',
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Max-Age=0',
    ].join('; ')
  }

  function isAuthenticated(request) {
    const token = cookieValue(request)
    const separator = token.lastIndexOf('.')

    if (separator < 1) return false

    const payload = token.slice(0, separator)
    const suppliedSignature = token.slice(separator + 1)
    const expectedSignature = sign(sessionSecret, payload)

    if (!safeEqual(suppliedSignature, expectedSignature)) {
      return false
    }

    try {
      const session = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      )

      return (
        session?.version === 1 &&
        Number.isFinite(session.issued_at) &&
        Number.isFinite(session.expires_at) &&
        session.issued_at <= now() + 60_000 &&
        session.expires_at > now() &&
        session.expires_at - session.issued_at === SESSION_TTL_MS
      )
    } catch {
      return false
    }
  }

  function pruneFailures() {
    if (failures.size <= MAX_FAILURE_ENTRIES) return

    const oldest = [...failures.entries()]
      .sort((a, b) => a[1].lastAttempt - b[1].lastAttempt)
      .slice(0, failures.size - MAX_FAILURE_ENTRIES)

    for (const [key] of oldest) {
      failures.delete(key)
    }
  }

  async function attemptLogin(request, password) {
    const key = clientKey(request)
    const currentTime = now()
    const previous = failures.get(key)

    if (previous?.blockedUntil > currentTime) {
      return {
        ok: false,
        retryAfter: Math.max(
          1,
          Math.ceil((previous.blockedUntil - currentTime) / 1000),
        ),
      }
    }

    let accepted

    try {
      accepted =
        typeof password === 'string' &&
        password.length > 0 &&
        password.length <= 512 &&
        (await verifyPassword(passwordHash, password))
    } catch {
      accepted = false
    }

    if (accepted) {
      failures.delete(key)

      return {
        ok: true,
        setCookie: issueSessionCookie(),
      }
    }

    const count = (previous?.count ?? 0) + 1
    const delay =
      count >= 4
        ? Math.min(
            60_000 * 2 ** Math.min(count - 4, 4),
            15 * 60_000,
          )
        : 0

    failures.set(key, {
      count,
      blockedUntil: currentTime + delay,
      lastAttempt: currentTime,
    })

    pruneFailures()

    return {
      ok: false,
      retryAfter: delay ? Math.ceil(delay / 1000) : 0,
    }
  }

  return {
    isAuthenticated,
    attemptLogin,
    clearSessionCookie,
  }
}
