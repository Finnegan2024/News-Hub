# NewsHub — Software Specification

Status: Draft v1
Owner: Finn
Last updated: 2026-07-31

## 1. Overview

NewsHub is a full-stack web application that aggregates news article summaries from
multiple organizations (publishers/outlets), lets registered users curate which
organizations' articles appear in their personal feed, and automatically tracks
which articles a user has read.

### 1.1 Core user stories

- As a visitor, I can register and log in with an email/password.
- As a user, I can browse a list of article summaries from organizations I follow.
- As a user, I can search/browse the catalog of available organizations and
  add or remove them from my followed list.
- As a user, my feed automatically reflects updates to my followed organizations
  (no manual "refresh my sources" step).
- As a user, articles I've read are visually distinguished from unread ones,
  without me having to mark them manually.

### 1.2 Out of scope (v1)

- Commenting, sharing, or social features.
- Push notifications / email digests.
- Full article text hosting (we store/display summaries and link out to the
  original source for full content, per most news API/RSS licensing terms).
- Multi-language i18n.
- Admin UI for managing organizations (seeded/managed via backend scripts or
  a minimal internal endpoint instead).

## 2. Tech stack

| Layer          | Choice                                                            |
|----------------|--------------------------------------------------------------------|
| Frontend       | React (Vite), TypeScript, React Router, TanStack Query             |
| Backend        | Node.js, Express, TypeScript                                        |
| Database       | PostgreSQL                                                          |
| ORM            | Prisma                                                              |
| Auth           | Server-side sessions (cookie-based), session store in Postgres     |
| Ingestion      | Node cron worker (node-cron / BullMQ) pulling NewsAPI + RSS feeds   |
| Deployment     | Render: 1 Web Service (API + ingestion worker in-process), 1 Static Site (frontend), Render Postgres |

Rationale notes:
- Session auth (vs. JWT) was chosen explicitly — simpler revocation (logout
  invalidates server-side immediately) and no token-refresh complexity on the
  frontend. Cost: requires sticky session store if we ever scale to multiple
  API instances (mitigated by storing sessions in Postgres/Redis, not memory).
- Prisma over raw SQL for schema migrations and type-safe queries given the
  data model is relational and moderately simple.
- Render hosts a single Web Service running both the Express API and the
  ingestion cron job in-process (e.g. `node-cron` scheduled inside the same
  server process), plus a managed Postgres instance — simplest/cheapest
  topology for v1's traffic and polling volume, at the cost of the polling
  job competing with request handling on the same dyno (acceptable given
  NewsAPI's own rate limit already caps how often it runs). Local dev still
  uses Docker Compose (Postgres only) so the app can run without a Render
  dependency during development.

## 3. Architecture

```
┌─────────────┐      HTTPS/JSON       ┌──────────────────┐
│   React SPA │ ───────────────────►  │  Express API      │
│  (Vite)     │ ◄───────────────────  │  (REST, sessions)  │
└─────────────┘                       └────────┬──────────┘
                                                │
                                                ▼
                                       ┌──────────────────┐
                                       │   PostgreSQL      │
                                       │ (users, orgs,     │
                                       │  articles, follows,│
                                       │  read_events,      │
                                       │  sessions)         │
                                       └────────┬──────────┘
                                                ▲
                                                │ writes
                                       ┌──────────────────┐
                                       │ Ingestion Worker  │
                                       │ - News API polling │
                                       │ - RSS polling      │
                                       │ - Summarization    │
                                       └──────────────────┘
```

The ingestion worker runs independently of the request/response cycle (a
scheduled job, not triggered per-request) so a slow external API/feed never
blocks a user request.

## 4. Data model

```
User
 - id (uuid, pk)
 - email (unique, citext)
 - password_hash
 - created_at

Organization
 - id (uuid, pk)
 - name
 - slug (unique)
 - source_type   enum('api', 'rss')
 - source_config jsonb   -- { newsApiSourceId } for 'api', { feedUrl } for 'rss'
 - logo_url        nullable
 - created_at

UserOrganizationFollow
 - user_id (fk -> User)
 - organization_id (fk -> Organization)
 - created_at
 - PK (user_id, organization_id)

Article
 - id (uuid, pk)
 - organization_id (fk -> Organization)
 - external_id        -- dedupe key from source (API article id / RSS guid)
 - title
 - summary            -- text, from API field or generated from RSS content
 - source_url
 - image_url           nullable
 - published_at
 - fetched_at
 - UNIQUE (organization_id, external_id)

ReadEvent
 - user_id (fk -> User)
 - article_id (fk -> Article)
 - read_at
 - trigger  enum('scrolled', 'dwell_45s')
 - PK (user_id, article_id)

Session   -- managed by connect-pg-simple or equivalent
 - sid (pk)
 - sess (jsonb)
 - expire
```

Indexes: `Article(organization_id, published_at desc)` for feed queries;
`ReadEvent(user_id)` for unread-count lookups.

## 5. API surface (REST, JSON, cookie session auth)

### Auth
- `POST /api/auth/register` — { email, password } → 201, sets session cookie
- `POST /api/auth/login` — { email, password } → 200, sets session cookie
- `POST /api/auth/logout` → 204, clears session
- `GET /api/auth/me` → current user or 401

### Organizations
- `GET /api/organizations` — full catalog, paginated, with `isFollowed` flag
  for the current user
- `POST /api/organizations/:id/follow` → 204
- `DELETE /api/organizations/:id/follow` → 204

### Feed / Articles
- `GET /api/feed?cursor=&limit=` — articles from followed organizations only,
  newest first, each item includes `isRead: boolean`
- `GET /api/articles/:id` — article detail (used when opening the reader view)

### Read tracking
- `POST /api/articles/:id/read-events` — body: `{ trigger: 'scrolled' | 'dwell_45s' }`
  - idempotent (upsert on `(user_id, article_id)`), first event wins for `read_at`

All endpoints except `/api/auth/register` and `/api/auth/login` require an
authenticated session (401 otherwise).

## 6. Read/unread tracking — behavior spec

Both signals are observed **only on the article detail page** (`/articles/:id`)
— nothing in the feed list view (`/feed`) contributes to read state. An article
becomes "read" for a user when **either** condition fires first, while the
detail page is open:

1. **Scroll signal**: the user scrolls the article detail content (any scroll
   event past a small threshold, e.g. >50px, inside the detail view).
2. **Dwell signal**: the article detail page has remained open/visible for a
   continuous 45 seconds — this is what marks short articles as read when
   there's nothing to scroll.

Implementation notes:
- Frontend detects the trigger and fires `POST /api/articles/:id/read-events`
  exactly once per article per session-view (debounced/deduped client-side to
  avoid spamming the endpoint).
- Backend upsert is the source of truth for idempotency — duplicate calls for
  an already-read article are a no-op (204, no error).
- "Unread" is simply the absence of a `ReadEvent` row for `(user, article)` —
  no separate boolean to keep in sync.
- The 45s dwell timer starts when the detail page mounts, and should pause
  while the tab is backgrounded (`visibilitychange`) so backgrounded tabs
  don't silently mark articles read.
- The scroll listener only needs to be attached while the detail page is
  mounted; it can be torn down once the read event fires.

## 7. Ingestion pipeline

- Each `Organization` row declares `source_type: 'api' | 'rss'` and a
  `source_config` blob (`{ newsApiSourceId }` for API sources, `{ feedUrl }`
  for RSS sources).
- A scheduled worker (every 2 hours) iterates organizations:
  - `api` sources: call NewsAPI's `/v2/top-headlines?sources={newsApiSourceId}`,
    mapping `title`/`description`/`url`/`urlToImage`/`publishedAt` to the
    corresponding `Article` columns, and `article.url` (NewsAPI's own
    per-article id surrogate) as `external_id`. Note: `/v2/top-headlines`
    ignores `category`/`country` params once `sources` is set, so each
    organization is polled individually by its `newsApiSourceId`.
  - `rss` sources: fetch + parse the feed (e.g. `rss-parser`), and since RSS
    entries often lack a real summary, generate one (either truncate/clean the
    `content:encoded` field, or call an LLM summarization step — flagged as a
    v1.1 enhancement if time-boxed).
  - Upsert into `Article` keyed on `(organization_id, external_id)` so re-polling
    is dedupe-safe.
- The `NEWS_API_KEY` credential lives in a worker-only env var, never sent to
  the frontend. At a 2-hour interval, 5 sources = 12 requests/source/day =
  60 req/day total, comfortably under NewsAPI's free-tier cap of 100 req/day.
- RSS ingestion code path stays in the architecture (Organization.source_type
  supports it, and the worker branches on it) but is not exercised until
  non-NewsAPI organizations are seeded post-v1.

## 8. Frontend pages

- `/register`, `/login`
- `/feed` — default authenticated landing page; infinite-scroll list of
  article summary cards from followed orgs, unread visually distinct
  (e.g. bold title + dot indicator) from read (dimmed/muted)
- `/organizations` — browse/search full catalog, follow/unfollow toggle per org
- `/articles/:id` — detail/reader view, triggers dwell timer

## 9. Non-functional requirements

- Passwords hashed with bcrypt/argon2, never logged.
- Session cookies: `httpOnly`, `secure` (in prod), `sameSite=lax`.
- Rate-limit `/api/auth/*` to mitigate credential stuffing.
- Feed queries paginated (cursor-based on `published_at`) — never load an
  unbounded article list.
- Ingestion worker must tolerate a single organization's feed/API failing
  without blocking others (per-source try/catch + logging).

## 10. MVP scope

### 10.1 In scope for MVP

- Auth: register, login, logout, `me` — session-based, as specified in §5.
- Organizations: catalog seeded with the first 5 NewsAPI sources from
  `/v2/sources?category=general&language=en`; follow/unfollow endpoints + UI.
- Ingestion: NewsAPI `/v2/top-headlines` polling, every 2 hours, for the 5
  seeded organizations only (no RSS sources yet).
- Feed: paginated article list scoped to followed organizations.
- Read/unread tracking: scroll + 45s-dwell triggers on the article detail
  page (§6), read-events endpoint, unread/read styling in the feed.
- Minimal empty/error handling needed for the app to be usable on day one:
  an empty-feed state before a user follows anything, and a basic "couldn't
  load" state if the feed/organizations API call fails. This is deliberately
  thin — just enough that the golden path isn't blocked by an unhandled
  blank screen — not full error-state design.

### 10.2 Explicitly deferred (post-MVP backlog)

- RSS ingestion for non-NewsAPI organizations (architecture supports it per
  §7, but no RSS org is seeded or exercised in MVP).
- LLM-based (or any) summarization quality work for RSS content.
- Organizations beyond the initial 5.
- Automated test suite (auth flow, follow toggle, read-event idempotency).
- Everything already listed in §1.2 (out of scope v1): social features,
  notifications/digests, full-article hosting, i18n, admin UI.

### 10.3 Build phases (MVP)

1. **Foundation**: repo scaffold, Postgres + Prisma schema, session auth
   (register/login/logout/me), Docker Compose for local dev.
2. **Organizations & follows**: seed the 5 NewsAPI orgs (§10.1), catalog
   endpoint, follow/unfollow endpoints + UI.
3. **Ingestion worker**: pull real articles from the 5 seeded orgs into
   `Article` on the 2-hour schedule.
4. **Feed UI**: article list scoped to followed orgs, pagination, empty state.
5. **Read/unread tracking**: scroll + dwell triggers, read-events endpoint,
   unread styling in feed.
6. **MVP hardening**: basic error states (feed/org API failures), sanity-check
   the empty-feed path, manual smoke test of the full golden path end to end.

Anything in §10.2 starts a second milestone after MVP ships, not a phase
within it.

## 11. Open questions to resolve before/while building

- Confirm the actual 5 source ids returned today by NewsAPI's
  `/v2/sources?category=general&language=en` (this list is server-defined and
  should be checked against the live API response rather than assumed, since
  NewsAPI can add/remove sources over time).
- NewsAPI key provisioning for the Render Web Service (env var `NEWS_API_KEY`).
  Confirmed: at the chosen 2-hour poll interval, 5 sources = 60 req/day,
  within the free tier's 100 req/day cap (see §7).
