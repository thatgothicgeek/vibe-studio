import test from 'node:test'
import assert from 'node:assert/strict'
import { accessVerifier } from './access.mjs'
import { generateKeyPair, SignJWT } from 'jose'

test('access configuration fails closed and rejects missing or forged assertions', async () => {
  assert.throws(() => accessVerifier({}), /Configure/)
  const verify = accessVerifier({ CF_ACCESS_ISSUER: 'https://test.cloudflareaccess.com', CF_ACCESS_AUD: 'test-audience', STUDIO_ALLOWED_EMAILS: 'owner@example.test' })
  assert.equal(await verify({ headers: {} }), false)
  assert.equal(await verify({ headers: { 'cf-access-jwt-assertion': 'forged' } }), false)
})

test('signed tokens require the right issuer, audience, email and expiry', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const env = { CF_ACCESS_ISSUER: 'https://test.cloudflareaccess.com', CF_ACCESS_AUD: 'studio', STUDIO_ALLOWED_EMAILS: 'owner@example.test' }
  const verify = accessVerifier(env, publicKey)
  const token = async (overrides = {}) => new SignJWT({ email: 'owner@example.test', ...overrides })
    .setProtectedHeader({ alg: 'RS256' }).setSubject('owner').setIssuer(env.CF_ACCESS_ISSUER)
    .setAudience('studio').setExpirationTime('1h').sign(privateKey)
  const request = value => ({ headers: { 'cf-access-jwt-assertion': value } })
  assert.equal(await verify(request(await token())), true)
  assert.equal(await verify(request(await token({ email: 'stranger@example.test' }))), false)
  for (const claims of [{ aud: 'another-app' }, { iss: 'https://other.cloudflareaccess.com' }, { exp: 1 }]) {
    const signed = await new SignJWT({ email: 'owner@example.test', sub: 'owner', iss: env.CF_ACCESS_ISSUER, aud: 'studio', exp: Math.floor(Date.now() / 1000) + 60, ...claims }).setProtectedHeader({ alg: 'RS256' }).sign(privateKey)
    assert.equal(await verify(request(signed)), false)
  }
})
