import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStudioServer } from './app.mjs'

test('production boundary: private app, read-only API, fixed upstream, safe failures', async t => {
  const dist = await mkdtemp(join(tmpdir(), 'studio-test-'))
  await writeFile(join(dist, 'index.html'), '<html>Studio fixture</html>')
  await mkdir(join(dist, 'assets'))
  await writeFile(join(dist, 'assets', 'app.js'), '/* built app */')
  const calls = []
  let upstream = () => new Response('{"ok":true}', { headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'private=secret' } })
  const server = createStudioServer({ dist, hubToken: 'server-only-fixture-token', authorize: async r => r.headers.authorization === 'Bearer user-fixture', fetchHub: async (...args) => { calls.push(args); return upstream() } })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(dist, { recursive: true }) })
  const base = `http://127.0.0.1:${server.address().port}`
  const get = (path, options = {}) => fetch(base + path, { headers: { Authorization: 'Bearer user-fixture', Cookie: 'do-not-forward=1' }, redirect: 'manual', ...options })
  assert.equal((await fetch(base + '/studio')).status, 401)
  assert.equal((await fetch(base + '/api/dashboard')).status, 401)
  assert.equal((await fetch(base + '/healthz')).status, 200)
  assert.equal(await (await get('/studio')).text(), '<html>Studio fixture</html>')
  assert.equal((await get('/studio/detail')).status, 200)
  assert.equal((await get('/assets/app.js')).status, 200)
  assert.equal((await get('/')).headers.get('location'), '/studio')
  for (const path of ['/api/sync', '/api/admin/status', '/api/unknown', '/.env', '/server.mjs', '//evil.test/api/signals', '/api/signals/%2Fsync']) {
    assert.ok([400, 404].includes((await get(path)).status), path)
  }
  assert.equal((await get('/api/dashboard', { method: 'POST' })).status, 405)
  assert.equal(calls.length, 0)
  const good = await get('/api/signals?limit=24')
  assert.equal(good.status, 200)
  assert.equal(good.headers.get('set-cookie'), null)
  assert.equal(good.headers.get('cache-control'), 'no-store')
  assert.equal(calls[0][0].href, 'https://hub.thegeek.guide/api/signals?limit=24')
  assert.deepEqual(calls[0][1].headers, { Authorization: 'Bearer server-only-fixture-token', Accept: 'application/json' })
  assert.equal(calls[0][1].redirect, 'error')
  upstream = () => new Response('server-only-fixture-token', { status: 401 })
  const failed = await get('/api/dashboard')
  assert.equal(failed.status, 502)
  assert.ok(!(await failed.text()).includes('server-only-fixture-token'))
  upstream = () => new Response('{"secret":"server-only-fixture-token"}', { headers: { 'Content-Type': 'application/json' } })
  assert.equal((await get('/api/dashboard')).status, 502)
  upstream = () => { throw new Error('Network timeout') }
  assert.equal((await get('/api/dashboard')).status, 502)
})
