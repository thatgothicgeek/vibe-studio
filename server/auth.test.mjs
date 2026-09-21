import test from 'node:test'
import assert from 'node:assert/strict'
import { createPasswordAuth } from './auth.mjs'

function request({
  cookie = '',
  ip = '127.0.0.1',
} = {}) {
  return {
    headers: cookie ? { cookie } : {},
    socket: { remoteAddress: ip },
  }
}

test('password auth fails closed without required configuration', () => {
  assert.throws(
    () => createPasswordAuth({}),
    /STUDIO_PASSWORD_HASH/,
  )

  assert.throws(
    () =>
      createPasswordAuth({
        STUDIO_PASSWORD_HASH: '$argon2id$fixture',
        STUDIO_SESSION_SECRET: 'short',
      }),
    /STUDIO_SESSION_SECRET/,
  )
})

test('successful login issues an authenticated eight-hour session', async () => {
  let clock = 1_000_000

  const auth = createPasswordAuth(
    {
      STUDIO_PASSWORD_HASH: '$argon2id$fixture',
      STUDIO_SESSION_SECRET: 'x'.repeat(64),
    },
    {
      now: () => clock,
      verifyPassword: async (_hash, password) =>
        password === 'correct horse battery staple',
    },
  )

  const result = await auth.attemptLogin(
    request(),
    'correct horse battery staple',
  )

  assert.equal(result.ok, true)
  assert.match(result.setCookie, /HttpOnly/)
  assert.match(result.setCookie, /Secure/)
  assert.match(result.setCookie, /SameSite=Strict/)
  assert.match(result.setCookie, /Max-Age=28800/)

  const cookie = result.setCookie.split(';')[0]

  assert.equal(
    auth.isAuthenticated(request({ cookie })),
    true,
  )

  clock += 8 * 60 * 60 * 1000 + 1

  assert.equal(
    auth.isAuthenticated(request({ cookie })),
    false,
  )
})

test('tampered session cookies are rejected', async () => {
  const auth = createPasswordAuth(
    {
      STUDIO_PASSWORD_HASH: '$argon2id$fixture',
      STUDIO_SESSION_SECRET: 'y'.repeat(64),
    },
    {
      verifyPassword: async () => true,
    },
  )

  const result = await auth.attemptLogin(
    request(),
    'anything',
  )

  const cookie = result.setCookie.split(';')[0]
  const [name, token] = cookie.split('=')
  const replacement =
    token.endsWith('a') ? 'b' : 'a'
  const tampered =
    `${name}=${token.slice(0, -1)}${replacement}`

  assert.equal(
    auth.isAuthenticated(request({ cookie: tampered })),
    false,
  )
})

test('repeated failures trigger per-client backoff', async () => {
  let clock = 10_000
  let verifications = 0

  const auth = createPasswordAuth(
    {
      STUDIO_PASSWORD_HASH: '$argon2id$fixture',
      STUDIO_SESSION_SECRET: 'z'.repeat(64),
    },
    {
      now: () => clock,
      verifyPassword: async () => {
        verifications += 1
        return false
      },
    },
  )

  for (let index = 0; index < 3; index += 1) {
    const result = await auth.attemptLogin(
      request({ ip: '10.0.0.1' }),
      'wrong',
    )

    assert.equal(result.retryAfter, 0)
  }

  const fourth = await auth.attemptLogin(
    request({ ip: '10.0.0.1' }),
    'wrong',
  )

  assert.equal(fourth.retryAfter, 60)

  const blocked = await auth.attemptLogin(
    request({ ip: '10.0.0.1' }),
    'wrong',
  )

  assert.equal(blocked.retryAfter, 60)
  assert.equal(verifications, 4)

  const otherClient = await auth.attemptLogin(
    request({ ip: '10.0.0.2' }),
    'wrong',
  )

  assert.equal(otherClient.retryAfter, 0)

  clock += 60_001

  const resumed = await auth.attemptLogin(
    request({ ip: '10.0.0.1' }),
    'wrong',
  )

  assert.ok(resumed.retryAfter >= 60)
})

test('logout cookie expires immediately', () => {
  const auth = createPasswordAuth(
    {
      STUDIO_PASSWORD_HASH: '$argon2id$fixture',
      STUDIO_SESSION_SECRET: 'q'.repeat(64),
    },
    {
      verifyPassword: async () => true,
    },
  )

  const cookie = auth.clearSessionCookie()

  assert.match(cookie, /Max-Age=0/)
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /Secure/)
  assert.match(cookie, /SameSite=Strict/)
})
