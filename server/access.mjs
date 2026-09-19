import { createRemoteJWKSet, jwtVerify } from 'jose'

export function accessVerifier(env, verificationKeys) {
  const issuer = env.CF_ACCESS_ISSUER
  const audience = env.CF_ACCESS_AUD
  const emails = new Set((env.STUDIO_ALLOWED_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean))
  if (!issuer || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !audience || !emails.size) {
    throw new Error('Configure CF_ACCESS_ISSUER, CF_ACCESS_AUD and STUDIO_ALLOWED_EMAILS before starting Studio.')
  }
  const keys = verificationKeys || createRemoteJWKSet(new URL('/cdn-cgi/access/certs', issuer))
  return async request => {
    const token = request.headers['cf-access-jwt-assertion']
    if (typeof token !== 'string') return false
    try {
      const { payload } = await jwtVerify(token, keys, { issuer, audience, algorithms: ['RS256'], requiredClaims: ['exp', 'sub', 'email'] })
      return typeof payload.email === 'string' && emails.has(payload.email.toLowerCase())
    } catch {
      return false
    }
  }
}
