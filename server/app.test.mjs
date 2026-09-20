import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdtemp,
  writeFile,
  mkdir,
  rm,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStudioServer } from './app.mjs'

test(
  'production boundary: login, sessions, read-only API and safe upstream failures',
  async t => {
    const dist = await mkdtemp(
      join(tmpdir(), 'studio-test-'),
    )

    await writeFile(
      join(dist, 'index.html'),
      '<html>Studio fixture</html>',
    )

    await mkdir(join(dist, 'assets'))

    await writeFile(
      join(dist, 'assets', 'app.js'),
      '/* built app */',
    )

    const calls = []

    let upstream = () =>
      new Response('{"ok":true}', {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'private=secret',
        },
      })

    const auth = {
      isAuthenticated: request =>
        request.headers.cookie === 'session=ok',

      attemptLogin: async (_request, password) =>
        password === 'correct'
          ? {
              ok: true,
              setCookie:
                'session=ok; Path=/; HttpOnly; Secure; SameSite=Strict',
            }
          : {
              ok: false,
              retryAfter: 0,
            },

      clearSessionCookie: () =>
        'session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
    }

    const server = createStudioServer({
      dist,
      hubToken: 'server-only-fixture-token',
      hubActionToken: 'server-only-action-token',
      auth,
      fetchHub: async (...args) => {
        calls.push(args)
        return upstream()
      },
    })

    await new Promise(resolve =>
      server.listen(0, '127.0.0.1', resolve),
    )

    t.after(async () => {
      await new Promise(resolve =>
        server.close(resolve),
      )

      await rm(dist, { recursive: true })
    })

    const base =
      `http://127.0.0.1:${server.address().port}`

    const signedIn = (
      path,
      options = {},
    ) =>
      fetch(base + path, {
        headers: {
          Cookie: 'session=ok',
          ...options.headers,
        },
        redirect: 'manual',
        ...options,
      })

    const anonymousStudio = await fetch(
      base + '/studio',
      { redirect: 'manual' },
    )

    assert.equal(anonymousStudio.status, 302)
    assert.equal(
      anonymousStudio.headers.get('location'),
      '/studio/login',
    )

    assert.equal(
      (await fetch(base + '/api/dashboard')).status,
      401,
    )

    const loginPage = await fetch(
      base + '/studio/login',
    )

    assert.equal(loginPage.status, 200)
    assert.match(
      await loginPage.text(),
      /VIBE STUDIO/,
    )

    const wrongLogin = await fetch(
      base + '/studio/login',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',
        },
        body: 'password=wrong',
        redirect: 'manual',
      },
    )

    assert.equal(wrongLogin.status, 401)
    assert.match(
      await wrongLogin.text(),
      /Unable to sign in/,
    )

    const goodLogin = await fetch(
      base + '/studio/login',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',
        },
        body: 'password=correct',
        redirect: 'manual',
      },
    )

    assert.equal(goodLogin.status, 303)
    assert.equal(
      goodLogin.headers.get('location'),
      '/studio',
    )
    assert.match(
      goodLogin.headers.get('set-cookie'),
      /HttpOnly/,
    )

    assert.equal(
      (await fetch(base + '/healthz')).status,
      200,
    )

    assert.equal(
      await (
        await signedIn('/studio')
      ).text(),
      '<html>Studio fixture</html>',
    )

    assert.equal(
      (
        await signedIn('/studio/detail')
      ).status,
      200,
    )

    assert.equal(
      (
        await signedIn('/assets/app.js')
      ).status,
      200,
    )

    const root = await signedIn('/', {
      redirect: 'manual',
    })

    assert.equal(
      root.headers.get('location'),
      '/studio',
    )

    for (const path of [
      '/api/sync',
      '/api/admin/status',
      '/api/unknown',
      '/.env',
      '/server.mjs',
      '//evil.test/api/signals',
      '/api/signals/%2Fsync',
    ]) {
      assert.ok(
        [400, 404].includes(
          (await signedIn(path)).status,
        ),
        path,
      )
    }

    assert.equal(
      (
        await signedIn('/api/dashboard', {
          method: 'POST',
        })
      ).status,
      405,
    )

    assert.equal(calls.length, 0)

    const good = await signedIn(
      '/api/signals?limit=24',
    )

    assert.equal(good.status, 200)
    assert.equal(
      good.headers.get('set-cookie'),
      null,
    )
    assert.equal(
      good.headers.get('cache-control'),
      'no-store',
    )

    assert.equal(
      calls[0][0].href,
      'https://hub.thegeek.guide/api/signals?limit=24',
    )

    assert.deepEqual(
      calls[0][1].headers,
      {
        Authorization:
          'Bearer server-only-fixture-token',
        Accept: 'application/json',
      },
    )

    assert.equal(
      calls[0][1].redirect,
      'error',
    )

    const refresh = await signedIn(
      '/api/actions/refresh',
      { method: 'POST' },
    )

    assert.equal(refresh.status, 200)
    assert.equal(
      calls[1][0],
      'https://hub.thegeek.guide/api/actions/refresh',
    )
    assert.equal(
      calls[1][1].headers.Authorization,
      'Bearer server-only-action-token',
    )

    const refreshStatus = await signedIn(
      '/api/actions/refresh/example-request',
    )

    assert.equal(refreshStatus.status, 200)
    assert.equal(
      calls[2][0].href,
      'https://hub.thegeek.guide/api/actions/refresh/example-request',
    )
    assert.equal(
      calls[2][1].headers.Authorization,
      'Bearer server-only-fixture-token',
    )

    const logout = await signedIn(
      '/studio/logout',
      {
        method: 'POST',
        redirect: 'manual',
      },
    )

    assert.equal(logout.status, 303)
    assert.equal(
      logout.headers.get('location'),
      '/studio/login',
    )
    assert.match(
      logout.headers.get('set-cookie'),
      /Max-Age=0/,
    )

    upstream = () =>
      new Response(
        'server-only-fixture-token',
        { status: 401 },
      )

    const failed = await signedIn(
      '/api/dashboard',
    )

    assert.equal(failed.status, 502)

    assert.ok(
      !(await failed.text()).includes(
        'server-only-fixture-token',
      ),
    )

    upstream = () =>
      new Response(
        '{"secret":"server-only-fixture-token"}',
        {
          headers: {
            'Content-Type':
              'application/json',
          },
        },
      )

    assert.equal(
      (
        await signedIn('/api/dashboard')
      ).status,
      502,
    )

    upstream = () => {
      throw new Error('Network timeout')
    }

    assert.equal(
      (
        await signedIn('/api/dashboard')
      ).status,
      502,
    )
  },
)
