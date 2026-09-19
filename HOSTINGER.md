# Vibe Studio production deployment

Core → Hub → MariaDB stays unchanged. Studio runs as a separate Node web app,
serves `dist/`, and reads Hub at `https://hub.thegeek.guide`.

## Deployment settings

- Repository: `thatgothicgeek/vibe-studio`
- Branch: `deploy/hostinger-studio` (isolates Studio from the existing Coming Soon deployment)
- Node: 22, at least 22.12
- Install: `npm ci`
- Build: `npm run build`
- Start: `npm start` (`node server.mjs`), not Vite preview or static hosting
- Domain: `studio.thegeek.guide`
- Use Hostinger's assigned `PORT`; public liveness route: `/healthz`

Keep the current Mini Vite service available until acceptance is complete.
Do not copy `.env`, backup folders, databases, or the Core sync credential into Git.

## Private access and credentials

1. Deploy the additive Hub read-token change. Add `STUDIO_READ_TOKEN` to Hub
   without changing `SYNC_TOKEN` or database variables. Use a new random token
   distinct from the Core token. Hub accepts it only for GET dashboard, health,
   signal list and signal detail. Core sync permissions remain unchanged.
2. Configure a Cloudflare Access self-hosted application for the entire
   `studio.thegeek.guide` hostname, including `/api/*`, restricted to the owner's
   approved email. Enable Cloudflare proxying for this hostname.
3. Set these Studio server environment variables in Hostinger:
   - `STUDIO_HUB_READ_TOKEN`: the matching Hub read token
   - `CF_ACCESS_ISSUER`: `https://<team>.cloudflareaccess.com` (no trailing slash)
   - `CF_ACCESS_AUD`: this Access application's audience
   - `STUDIO_ALLOWED_EMAILS`: approved email(s), comma separated
4. Deploy the Node app. The server refuses to start without access configuration;
   it validates JWT signature, issuer, audience, expiration and approved email.
   A Hostinger preview/origin address cannot bypass this validation.

No token has a `VITE_` prefix. Production never loads the Mini's sync-token file.
The local development proxy retains its existing fallback for continuity.
Changing a token's environment-variable name does not make it read-only: use
the separately generated token and deploy Hub's permission change first.

## Acceptance before switching daily use

- Tests and production build pass from this branch alone.
- Anonymous Studio and API access fails; `/healthz` returns only generic status.
- Signed-in Dashboard, Discover and Signal Detail load real Hub records.
- Read token cannot authenticate `/api/sync` or `/api/admin/status` at Hub.
- Studio rejects write methods and all other API routes.
- No credential appears in built assets, browser requests, responses or logs.
- On the actual iPhone, open HTTPS Studio, sign in, verify the local-time greeting,
  all five category leaders, scrolling, Discover and an individual Signal.
- Test with Tailscale off. A mobile viewport preview alone is not iPhone acceptance.
- Verify a subsequent Git push triggers the correct Hostinger app deployment.

## Normal changes and rollback

Make changes locally, test, commit, then push this deployment branch. Keep the
Coming Soon app on its existing branch. If Studio fails, roll back only Studio
to its last successful Hostinger deployment; continue using the existing Mini
Studio URL. Do not stop Core, change its sync token, or restore database volumes.

References:
- https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- https://www.hostinger.com/support/how-to-add-environment-variables-during-node-js-application-deployment/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
