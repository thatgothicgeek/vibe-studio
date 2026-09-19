# Current update

See [STUDIO-UPDATE.md](STUDIO-UPDATE.md) for the deployed Dashboard, Discover, Sources management and category overrides. The integration notes below describe the earlier release; its source-management and classification-override limitations are superseded.

# Studio: Signal and Compass integration

Deployed to the Mac mini on September 11, 2026.

Private address: https://vibehub.thatgothicgeek.com/studio/
Release: /Users/jamesdavis/Projects/VibeSignal/storage/releases/20260911T180810Z

## Working now

- Permanent Studio shell using the staged Inter/Lucide visual system, full navigation, light/dark themes and mobile drawer.
- Discover Stories reads the existing VibeCore clusters, source evidence, relationships and scoring decisions. Production stories are shown by default; calibration data is opt-in.
- High/Medium/Low priority and readable explanations; raw scores and private queue payloads are omitted from the interface.
- Stable News Desk cases, explicit research saves, artwork references, Watch/Dismiss/Restore, Today/Roundups/Features assignments, Seen tracking, version conflicts, browser-session draft recovery and cached evidence during processor outages.
- Queue and Status show the existing Compass queue and eligibility boundary. Saved Compass analysis is rendered as untrusted research alongside source evidence, never applied to editorial notes.
- Dashboard and News Desk link story cases alongside the preserved legacy article workspaces. Activity records new case actions separately from legacy saves.
- Same-origin /studio/api/v1/ interfaces for story reads, queue/status reads and case actions. Version checks, CSRF, and the native Studio session protect case changes. The Hub read-only credential remains server-side.

## Collection and processing

The original FreshRSS collector is unchanged. A Mini launch agent, com.vibecore.studio-bridge, runs every 15 minutes at background priority. Each run imports up to 100 recently published articles from the existing collector and embeds/clusters up to eight pending items using the already installed native modules and embedding configuration, then runs deterministic scoring.

The bridge covers the rolling seven-day publication window. Older articles remain in the collected-article inbox. It stores original article IDs in a durable mapping, deduplicates canonical URLs, preserves existing source policy and exact source text, and leaves existing embeddings/memberships untouched. Calibration evidence is excluded from production clustering and its original relationships are preserved.

Available feed excerpts are labeled as excerpts. They are not promoted to complete source text or fabricated exact sentences; incomplete evidence cannot qualify for Compass. Existing source items are append-only through this bridge; changed excerpts do not replace preserved evidence. A future source-refresh policy must handle deliberate updates.

At verification: 200 production articles imported, 16 production stories processed, 184 items waiting for embeddings. This backlog continues on the Mini independently of the MacBook. These are a timestamped verification snapshot, not permanent counts.

Studio reads an atomic SQLite backup projection under ~/VibeCore/data/studio, mounted read-only into the web container. The authoritative database remains ~/VibeCore/data/vibe-signal.db. The projection avoids sharing live SQLite locks across macOS and Docker Desktop. No database server, frontend framework or new model was installed.

## Verification

- 173 PHP checks passed in the release container: collection/store 44, requests 29, classification/refresh 27, legacy News Desk 26, staged Studio 25, integration 22.
- Five bridge tests passed: repeat imports, exact-text boundary, existing source policy, normalized URL duplicates, disabled sources and transaction rollback/checkpoint behavior.
- Live Studio, Stories, Queue, Status and API reads returned HTTP 200. Invalid CSRF returned 403; an unknown story returned 404 without creating a case.
- All 3,000 pre-release article IDs and editorial fields were preserved; legacy workspace rows matched the backup. SQLite integrity passed and the two store backups opened cleanly.
- Original VibeCore source, sentence, embedding, membership, relationship and source-policy rows remained present and unchanged; integrity and foreign-key checks passed.
- Unauthenticated Studio and API requests redirect to the native Studio login. The public website remains independent.
- The collector and FreshRSS retained the same container IDs, image IDs and start times. Homebridge retained PID 1022.
- Local browser QA: research save/reopen, both themes, 320px layout without horizontal overflow, mobile navigation, and search-dialog Escape/focus return. Actual 200% browser zoom was not established by the available browser controls.
- The public browser reached the Cloudflare sign-in page; a signed-in external browser session was not available. Live origin/API checks were performed from the Mini's web container.

## Boundaries still open

This is the Signal/Compass-to-Studio integration, not completion of every item in the earlier Phase 1 plan.

- The MacBook Neo Compass analysis worker is still not installed. Queue and result integration is ready, but no new Compass analysis was run or claimed.
- Full-text acquisition, source configuration CRUD/OPML, manual cluster merge/split, story-level classification overrides and explicit Compass retry/reanalysis remain unfinished.
- Full source-management synchronization and complete Phase 1 acceptance, including signed-in external browser and 200% zoom checks, remain open.
- WordPress creation, publishing, Media and Presentation remain deferred and clearly unavailable.

## Backups and rollback

Before rollout, consistent signal.sqlite and newsdesk.sqlite backups were created in the existing application storage/backups directory. The pre-release pair is signal-20260911-180827-72fda7.sqlite and newsdesk-20260911-180827-028b82.sqlite.

The verified VibeCore baseline is ~/VibeCore/backups/studio-integration-20260911/verified.db. The release also holds a private FreshRSS data/configuration backup in freshrss-backup. These backups stay on the Mini.

From this release directory, scripts/rollback-studio-host.sh disables the bridge launch agent and restores the prior web image without restarting the collector or restoring/deleting databases. New evidence and editorial records remain preserved. The rollback script was inspected but not executed against the live system.

Local implementation: /Users/thatgothicgeek/Projects/VibeSignal. No Git reset or cleanup was performed; pre-existing changes were retained.
