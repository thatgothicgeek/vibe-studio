# Vibe Studio production deployment

Core → Hub → MariaDB stays unchanged.

Studio runs as a separate Node web app on Hostinger, serves the built React
interface from `dist/`, provides its own private password session, and reads Hub
through the server-side read-only credential.

## Deployment settings

- Repository: `thatgothicgeek/vibe-studio`
- Branch after merge: `main`
- Node: 22, at least 22.12
- Install: `npm ci`
- Build: `npm run build`
- Start: `npm start`
- Start process: `node server.mjs`
- Domain: `studio.thegeek.guide`
- Public health route: `/healthz`

Do not deploy Studio as static hosting or with `vite preview`.
The Node server is required for authentication and the private Hub proxy.

Keep the existing Mini Studio available until hosted acceptance is complete.

## Production secrets

Set these only in the Hostinger environment.

### STUDIO_HUB_READ_TOKEN

The dedicated Hub read-only credential.

It must match the Hub `STUDIO_READ_TOKEN`.

Do not use the Core `SYNC_TOKEN`.

### STUDIO_PASSWORD_HASH

An Argon2id hash of the Studio password.

Generate it locally. Never store the plaintext password in Git or Hostinger
configuration.

### STUDIO_SESSION_SECRET

A cryptographically random secret used to sign Studio sessions.

Use at least 32 random bytes.

### PORT

Use the port supplied by Hostinger. The application defaults to 3000 only for
local execution.

No private variable may use a `VITE_` prefix because Vite-prefixed variables can
be included in browser code.

## Native login behavior

Studio authentication is handled entirely by the Node application.

- `/studio/login` is the login page.
- Successful authentication creates an HMAC-signed session.
- Sessions expire after eight hours.
- The session cookie is HttpOnly, Secure and SameSite=Strict.
- Repeated failed logins receive increasing backoff.
- Login failures use a generic error response.
- `/studio/logout` invalidates the browser session.
- Anonymous Studio pages redirect to `/studio/login`.
- Anonymous `/api/*` requests receive HTTP 401.
- The Hub read credential remains server-side and is never sent to the browser.

The login screen follows the Studio visual language: dark neutral surfaces,
restrained vaporwave accents, rounded containers and subtle neon glow.

## Hub boundary

Hub accepts `STUDIO_READ_TOKEN` only on the Studio read routes:

- `/api/health`
- `/api/dashboard`
- `/api/signals`
- `/api/signals/:id`

The Studio credential must not authenticate:

- `/api/sync`
- `/api/admin/status`

Core synchronization continues using its separate sync credential.

## Domain setup

Do not create `studio.thegeek.guide` until the Hostinger Node application is
running successfully.

After the application starts with all required environment variables:

1. Add or bind `studio.thegeek.guide` to the Studio application.
2. Allow Hostinger to provision DNS/SSL.
3. Confirm HTTPS is active before testing login sessions because the production
   cookie uses the Secure attribute.

## Acceptance checklist

Before switching daily use to the hosted Studio:

- `npm test` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `/healthz` returns only generic status.
- Anonymous `/studio` redirects to `/studio/login`.
- Incorrect passwords display only the generic error.
- Correct password opens Studio.
- Logout ends the session.
- Anonymous `/api/*` access is rejected.
- Dashboard loads live Hub records.
- Discover loads live Hub records.
- Signal Detail loads live Hub records.
- All five Dashboard category leaders appear.
- Local-time greeting is correct.
- Hub credentials do not appear in browser requests, responses or built assets.
- Read-only Studio token still receives 401 from Hub write/admin routes.
- iPhone acceptance is performed with Tailscale disabled.
- A subsequent Git push triggers the intended Hostinger deployment.

## Normal workflow

After production acceptance:

local edit
→ test
→ commit
→ push to GitHub
→ Hostinger deploy
→ verify `studio.thegeek.guide`

The Mini remains the Vibe Core processing node. Studio does not depend on the
Mini being online to serve previously synchronized Hub data.

## Rollback

If a Studio deployment fails:

1. Roll back only the Studio Hostinger application to its last working deploy.
2. Continue using the existing Mini Studio URL if necessary.
3. Do not change the Core sync token.
4. Do not restore or alter Hub database volumes.
5. Do not interrupt Core → Hub synchronization.
