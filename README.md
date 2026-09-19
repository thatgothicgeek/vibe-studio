# Vibe Studio / Signal backend

A private workspace for The Geek Guide. PHP and Apache serve the dashboard and Signal; FreshRSS remains a separate container with its existing subscriptions and data.

## Guide-based Studio — development change, not deployed

Studio uses a native password login. Set `STUDIO_PASSWORD_HASH` and `STUDIO_SESSION_SECRET` in the host environment; neither the password nor the Hub read token belongs in Git. Sessions use an HttpOnly, Secure, SameSite=Strict cookie with an eight-hour lifetime, generic login errors, and per-IP backoff after repeated failures.

Sources: The Geek Guide / Vibe Master Spec MVP V1, sections 3 and 9–10; Visual System Guide, Studio / Queue / Status sheets. Later user instructions keep deterministic work first and defer new AI/MCP/OpenClaw infrastructure.

`/studio/` opens Dashboard. Discover is `/studio/index.php`; the legacy `/signal/` inbox remains usable. All ten guide destinations share a fixed collapsible desktop sidebar, left mobile drawer, search dialog, New Content menu, and separate Quick Post entry. Dark/light themes use the exact neutral/blue tokens, self-hosted Inter, and the existing licensed Lucide subset.

Dashboard, source inventory, Watchlist, News Desk, classification browsing, existing job status, recorded activity, and collection health read the current stores. Content/media/presentation expose the unavailable publishing connection honestly. Format selection does not create a draft. This is not the complete Master Spec MVP: authenticated Engine integration, six composers/publication, source CRUD/OPML, clustering/ranking, editable organization, approved media and working/live presentation remain pending. No new database or migrations were added.

Validation: run `php tests/run.php`, `php tests/requests.php`, `php tests/topics-refresh.php`, `php tests/newsdesk.php`, and `php tests/studio.php`. Requests support `VIBE_TEST_PREFIX=/studio`. Fixtures use temporary storage, not production data. `scripts/check-hub.php` checks routes against an explicitly selected HTTP instance.

The Mac mini rollout is separate. Do not run the general deployment script for a shell-only release: it also recreates the collector and triggers collection. A scoped rollout must replace only web, preserve rollback information and volumes, and verify external access. The image entrypoint also runs existing migrations/categorization; account for that startup behavior even though this patch adds no migration.

## Historical deployment: September 7, 2026

- `https://vibehub.thatgothicgeek.com/`: Hub dashboard.
- `/signal/`: SQLite discovery inbox, manual refresh, automatic collection every 15 minutes, topics, saved stories, dismissals, and notes.
- `/rss/`: FreshRSS with native subpath support and its existing login.
- `/studio/`: native Vibe Studio workspace protected by the password login described above.

Active mini release: `/Users/jamesdavis/Projects/VibeSignal/storage/releases/20260907T232500Z`. The deployment imported 796 articles. Web and collector health checks passed. The original app had no collector and no existing Signal database.

Cloudflare Tunnel continues to target `http://127.0.0.1:8082` for the Hub. Studio authentication is handled by the application; its Hub read-only credential stays server-side. The public main site remains independent.

## Routing and persistence

```
existing Tunnel → 127.0.0.1:8082 (Apache)
                                      /          redirect to /studio/
                                      /signal/   PHP + Signal SQLite
                                      /rss/      FreshRSS over Docker network
                                      /studio/   PHP Studio shell + existing SQLite
```

Apache uses filesystem aliases for Studio and legacy Signal, so PHP generates paths from its actual script location. It never trusts a browser-supplied prefix header. Local PHP development at the root remains supported. Only `hub/` and `public/` are web-accessible; configuration, scripts, and storage are outside the document roots.

FreshRSS has a native Apache `/rss/` alias configured in `freshrss/hub-path.conf`, with canonical base URL `https://vibehub.thatgothicgeek.com/rss`. The proxy preserves that path rather than stripping it or rewriting response bodies. Existing `127.0.0.1:8080` root access redirects to `/rss/i/`; the original root API remains available to Signal. This addresses FreshRSS root-relative redirects, login links, assets, and cookies. See the [FreshRSS reverse-proxy guidance](https://freshrss.github.io/FreshRSS/en/admins/Caddy.html) for the base-URL requirement.

The live FreshRSS Compose configuration combines the original `freshrss/compose.yaml` with the active release's `rss-hub.yaml`. The override pins the original running image and mounts the alias configuration. Both configuration paths are recorded in Docker's Compose labels. Preserve that override when recreating FreshRSS. The MacBook's `freshrss/compose.yaml` now includes the alias mount for future source-based deployment; it does not automatically set an existing database's base URL.

- App project: `vibesignal-app`, localhost-only port 8082.
- Collector: independent service, no published ports, immediate collection and 15-minute interval; retries are independent of browser visits.
- Signal volume: `vibesignal-app_signal_storage`.
- FreshRSS project: `vibesignal`, localhost-only port 8080, original volumes retained.
- Shared internal network: `vibesignal_default`.
- Containers restart when Docker is running. Boot before macOS login has not been tested.

## Inbox behavior

Schema version 2 uses SQLite WAL, transactions, a five-second write timeout, and coordinated collector locking. Initial collection imports the last 30 days available in FreshRSS; later windows overlap by a day. Each page and continuation token commit together for recovery after interruption. Exact FreshRSS IDs deduplicate stories. Metadata updates preserve editorial state and notes. History is retained without automatic deletion.

Refresh uses a CSRF-protected POST and bounded pages, with visible progress. It collects what FreshRSS already has; it does not force publishers or FreshRSS subscriptions to update. FreshRSS's existing feed polling schedule remains unchanged.

Headline and feed-excerpt rules suggest Games, Movies, TV, Comics, or Technology. Ambiguous stories remain Uncategorized. Suggestions record matched terms and a rules version. Users can filter by topic, correct it, or restore automatic classification; manual choices survive collection. This is the framework for future categorization, not an AI integration. Edit `config/topics.php` and increment its version when changing rules; `php scripts/categorize.php` backfills existing stories. No clustering, automatic discarding, publisher scraping, or WordPress changes occur.

Inbox, Saved, Dismissed, and All articles support headline/excerpt search, source/topic/date filters, and pagination. Notes and status edits are revision-checked; conflicting edits retain the submitted draft for review. All actions stay local to Signal. Feed content is escaped, excerpts are plain text, and publisher links accept only HTTP(S).

## Development and checks

MacBook source: `/Users/thatgothicgeek/Projects/VibeSignal`. Mini original source: `/Users/jamesdavis/Projects/VibeSignal`. No new commits or pushes were made during this deployment.

Use PHP 8.4+ with curl, json, pdo_sqlite, and sessions. `.env` uses `KEY="JSON string"` lines, not ordinary dotenv. Never source it, print it, or include it in an image. Keep mode 0600. The FreshRSS API password is separate from its web login. Containers mount the existing mini file as a secret and copy it to restricted temporary runtime storage.

```sh
php scripts/migrate.php
php scripts/collect.php
php -S 127.0.0.1:8081 -t public
php tests/run.php
php tests/requests.php
php tests/topics-refresh.php
```

Only start a preview if the port is free. Root PHP preview covers Signal; use the container to check the complete Apache Hub and FreshRSS proxy. `VIBESIGNAL_PREVIEW_URL` defaults to the container's `/signal/` for smoke checks.

Verified: 88 local checks; isolated container import, outage recovery, escaping, private paths, backup and recreation; a separate SQLite-safe FreshRSS copy for subpath testing; live page/redirect/asset checks; real API import; live refresh and CSRF rejection. Hub mobile appearance was inspected in the browser. Full authenticated FreshRSS browsing and physical-device acceptance remain user checks.

On the mini, run Docker commands through `docker-headless`. Its restricted PATH currently cannot locate Docker Desktop's credential helper during a build. This deployment built from the official PHP image using an empty temporary Docker configuration and the existing local Docker socket; it did not modify credential settings. Check this environment issue before using the general `deploy-mini.sh` build flow.

## Operations and rollback

From the active release directory:

```sh
docker-headless compose --env-file /dev/null -p vibesignal-app ps
docker-headless compose --env-file /dev/null -p vibesignal-app exec -T --user www-data web php scripts/collect.php
docker-headless compose --env-file /dev/null -p vibesignal-app exec -T --user www-data web php scripts/smoke.php
docker-headless compose --env-file /dev/null -p vibesignal-app exec -T --user www-data web php scripts/backup.php
```

`--env-file /dev/null` keeps Compose from interpreting the JSON-valued configuration as dotenv. Signal backups use SQLite `VACUUM INTO` and live under the volume's `backups/`. The deployment retained a private FreshRSS snapshot with SQLite-safe database copies under the release's `freshrss-backup/`, plus the prior configuration and image identifiers. These files contain private data and must never be published or committed.

To reverse this Hub cutover, from this specific release:

```sh
sh scripts/rollback-hub-host.sh
```

This restores the previous FreshRSS URL/configuration, removes its alias mount through the old Compose configuration, and restores the prior app image. It stops the newly introduced collector but retains all databases and volumes. The recorded pre-Hub app was Phase 1 and does not read the newer database. For future schema-changing releases, verify old-image compatibility separately before relying on image-only rollback. Never run `down -v`, prune production volumes, or restore a database over newer notes without an explicit recovery decision.

Future apps should get their own internal service and explicit proxy route. Configure each app's base path and authentication requirements before enabling it. Keep the public origin bound to localhost; no public sharing route or extra published container port is needed.

## Optional local AI and News Desk

The deployed AI release adds `/signal/desk.php` and a per-article story workspace. Open a workspace from an inbox story, write your own summary/opinion/angle, optionally rate it, attach source links, and record image credits and usage notes. Save explicitly; conflicting edits retain your draft alongside the saved version. Draft-package downloads contain saved human writing and source provenance, not unaccepted AI output. Studio import remains deferred.

AI is requested per story. A native mini worker claims jobs using Docker's local command interface, sends only the headline and feed excerpt to loopback Ollama, and stores validated suggestions. No extra network listener, cloud inference, automatic topic changes, story merging, or publishing is enabled. The worker allows three attempts with backoff; expired leases recover interrupted jobs. Source changes invalidate earlier suggestions. Users explicitly accept a topic; story type and writing remain editable.

Editorial work and AI jobs use a separate `newsdesk.sqlite` (schema 1) in the existing volume. Signal stays at schema 2 for rollback compatibility. `scripts/backup.php` backs up both databases separately with SQLite-safe snapshots; editorial data is retained on rollback. Run `php tests/newsdesk.php` for the additional 26 checks.

The host worker starts at login through `com.vibesignal.ai-worker`. It is independent of the collector and Ollama's existing login service. Before a rollback, stop this worker with `launchctl bootout gui/$(id -u)/com.vibesignal.ai-worker` on the mini, then run the release's `scripts/rollback-host.sh`. Keep the worker stopped while using an image without the queue command. No database restoration is needed. Restart it with `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.vibesignal.ai-worker.plist` only after restoring a compatible app.

Image search opens external search pages; it never downloads or attaches images. Credits and usage notes record the user's review rather than declaring an image cleared for publication.

AI release: `/Users/jamesdavis/Projects/VibeSignal/storage/releases/20260908T002500Z`. The previous app image and Compose configuration are retained in that release for rollback. The revised eight-example evaluation matched both labels on 4/8 examples, with exact source evidence on 8/8. This small evaluation supports only experimental, human-reviewed use; it is not an accuracy guarantee. The worker uses the existing Qwen3 model with reasoning enabled and a bounded output budget. No other model was installed.
