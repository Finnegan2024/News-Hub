# NewsHub — MVP Task List

Derived from [SPEC.md](./SPEC.md) §10.3. Each phase is meant to be completed and
smoke-tested before starting the next — phases 1-3 have nothing to look at in
a browser until phase 4, but each is independently testable via API calls.

## Phase 1 — Foundation

- [ ] `git init`, base repo structure: `/api` (Express) and `/web` (Vite React), or a monorepo layout — pick one and note it in SPEC.md if it deviates from a flat two-folder split
- [ ] `docker-compose.yml` for local Postgres
- [ ] Prisma installed in `/api`, `schema.prisma` with `User` and `Session` models from §4
- [ ] `prisma migrate dev` — first migration applies cleanly
- [ ] Express app skeleton: JSON body parsing, cookie-session middleware backed by `connect-pg-simple` (or equivalent) pointed at Postgres
- [ ] `POST /api/auth/register` — hash password (bcrypt/argon2), create `User`, start session
- [ ] `POST /api/auth/login` — verify password, start session
- [ ] `POST /api/auth/logout` — destroy session
- [ ] `GET /api/auth/me` — return current user from session, 401 if none
- [ ] Auth middleware that 401s protected routes when no session
- [ ] Manual smoke test: register → login → me → logout, via curl/Postman
- [ ] `/web` skeleton: Vite + React + TypeScript + React Router + TanStack Query, base routing shell for `/register`, `/login`

## Phase 2 — Organizations & follows

- [x] Extend `schema.prisma` with `Organization` and `UserOrganizationFollow` models from §4
- [x] Migration applied
- [x] Obtain a NewsAPI key, store as `NEWS_API_KEY` in `/api/.env` (never committed)
- [x] One-off script (`scripts/seed-organizations.ts` or similar) that calls NewsAPI
      `/v2/sources?category=general&language=en`, takes the first 5 results, and
      inserts them as `Organization` rows with `source_type: 'api'` and
      `source_config: { newsApiSourceId }`
- [x] Run the seed script against local Postgres, verify 5 rows exist
- [x] `GET /api/organizations` — list all, with `isFollowed` computed for the
      requesting user
- [x] `POST /api/organizations/:id/follow` — upsert `UserOrganizationFollow`
- [x] `DELETE /api/organizations/:id/follow` — remove the row (no-op if absent)
- [x] Manual smoke test: list orgs, follow 2, list again (isFollowed reflects it), unfollow 1
- [x] `/organizations` page in `/web`: list from the endpoint, follow/unfollow toggle button per row

## Phase 3 — Ingestion worker

- [x] Extend `schema.prisma` with the `Article` model from §4, including the
      `UNIQUE (organization_id, external_id)` constraint
- [x] Migration applied
- [x] NewsAPI client module: given a `newsApiSourceId`, call
      `/v2/top-headlines?sources={id}`, return mapped `{title, description/summary, url, urlToImage, publishedAt}`
- [x] Ingestion function: for each seeded `Organization`, fetch articles, upsert
      into `Article` keyed on `(organization_id, external_id)` where
      `external_id` = the article's `url`
- [x] Per-source try/catch so one failing source doesn't stop the others (§9)
- [x] `node-cron` (or equivalent) schedule running the ingestion function every
      2 hours, started when the Express server boots (single-service topology
      per §2/§10.1 — no separate worker process)
- [x] Manual trigger path for local dev (e.g. an npm script or an internal-only
      endpoint) so you don't have to wait 2 hours to see articles land
- [x] Verify: run ingestion once locally, confirm `Article` rows appear for all
      5 organizations, re-run and confirm no duplicate rows (dedupe works)

## Phase 4 — Feed UI

- [x] `GET /api/feed?cursor=&limit=` — articles from the current user's
      followed organizations only, newest-first by `published_at`,
      cursor-paginated (§9)
- [x] `GET /api/articles/:id` — single article detail
- [x] `/feed` page in `/web`: fetch via TanStack Query, render article summary
      cards (title, summary, org name/logo, published date)
- [x] Infinite scroll / "load more" wired to the cursor param
- [x] Empty state: user has no follows yet → prompt to visit `/organizations`
      (§10.1 — this is in-scope for MVP, not deferred)
- [x] Basic error state: feed fetch fails → show a retry-able error message
      instead of a blank screen
- [x] `/articles/:id` detail page: fetch and render full summary + link to
      `source_url`
- [ ] Manual smoke test: follow orgs → see their articles in feed → open one

## Phase 5 — Read/unread tracking

- [ ] Extend `schema.prisma` with the `ReadEvent` model from §4
- [ ] Migration applied
- [ ] `POST /api/articles/:id/read-events` — upsert on `(user_id, article_id)`,
      idempotent, first `read_at`/`trigger` wins
- [ ] Feed and article-detail endpoints include `isRead` (presence of a
      `ReadEvent` row) per §6
- [ ] Detail page: scroll listener (>50px threshold) fires the read-event once,
      then detaches
- [ ] Detail page: 45s dwell timer starts on mount, fires the read-event if it
      completes before the scroll trigger does, pauses on `visibilitychange`
      when the tab is backgrounded
- [ ] Client-side dedupe so a single article view fires at most one
      `read-events` call even if both triggers would otherwise fire
- [ ] Feed styling: visually distinguish read vs. unread cards (e.g. bold
      title + dot for unread, dimmed for read)
- [ ] Manual smoke test: open a long article and scroll → marked read
      immediately; open a short article and wait 45s without scrolling →
      marked read at ~45s, not before

## Phase 6 — MVP hardening

- [ ] Rate-limit `/api/auth/register` and `/api/auth/login` (§9)
- [ ] Confirm session cookie flags: `httpOnly`, `secure` in production,
      `sameSite=lax`
- [ ] Confirm ingestion failures are logged but don't crash the server process
- [ ] Full manual golden-path run-through end to end: register → follow 5
      orgs → wait for (or manually trigger) ingestion → browse feed → read
      an article via both trigger paths → confirm read state persists on
      reload → logout → login again → state still correct
- [ ] Render deployment: one Web Service (API + in-process cron) + Render
      Postgres + Static Site for `/web`; `NEWS_API_KEY` and session-secret
      env vars set in the Render dashboard, not committed
- [ ] Post-deploy smoke test of the same golden path against the live Render URL

## Explicitly not on this list

Per SPEC.md §10.2: RSS ingestion, non-NewsAPI organizations, LLM summarization,
and an automated test suite are post-MVP — do not pull them into a phase above
without updating the spec first.
