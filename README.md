# NewsHub

A full-stack news aggregator. Register, follow organizations you care about,
and read a personalized feed that automatically tracks what you've already
read.

**Live app:** https://newshub-web.onrender.com

## Features

- Email/password registration and login (server-side sessions)
- Browse a catalog of news organizations and follow/unfollow them
- A feed of article summaries from your followed organizations, pulled from
  [NewsAPI](https://newsapi.org), refreshed every 2 hours
- Automatic read/unread tracking — an article is marked read when you scroll
  past it or spend 45 seconds on its detail page, whichever happens first

See [SPEC.md](./SPEC.md) for the full product spec and [TASKS.md](./TASKS.md)
for the phase-by-phase build log.

## Tech stack

| Layer      | Choice                                                          |
|------------|------------------------------------------------------------------|
| Frontend   | React (Vite), TypeScript, React Router, TanStack Query           |
| Backend    | Node.js, Express, TypeScript                                     |
| Database   | PostgreSQL via Prisma                                            |
| Auth       | Server-side sessions (`express-session` + `connect-pg-simple`)   |
| Ingestion  | `node-cron` polling NewsAPI, running in-process on the API server |
| Deployment | Render (Web Service, Static Site, Postgres) — see `render.yaml`  |

## Project structure

```
api/            Express API, Prisma schema, ingestion worker
  prisma/       schema.prisma + migrations
  scripts/      seed-organizations.ts — seeds the top 5 NewsAPI general/en sources
  src/
    routes/     auth, organizations, feed, articles
    lib/        prisma client, session config, NewsAPI client, ingestion logic
web/            Vite + React frontend
  src/
    pages/      Login, Register, Feed, Organizations, Article detail
    hooks/      TanStack Query hooks, read-tracking logic
    lib/        typed API client functions
render.yaml     Render Blueprint (API + Static Site + Postgres)
```

## Local development

### Prerequisites

- Node.js 18+
- Docker (for local Postgres)
- A free [NewsAPI](https://newsapi.org) API key

### Setup

```bash
git clone https://github.com/Finnegan2024/News-Hub.git
cd News-Hub

# Start Postgres
docker compose up -d

# Backend
cd api
npm install
cp .env.example .env   # fill in NEWS_API_KEY and SESSION_SECRET
npx prisma migrate dev
npm run seed:organizations
npm run dev             # http://localhost:4000

# Frontend (in a second terminal)
cd web
npm install
echo "VITE_API_URL=http://localhost:4000/api" > .env
npm run dev              # http://localhost:5173
```

In development, ingestion can be triggered on demand instead of waiting for
the 2-hour schedule:

```bash
curl -X POST http://localhost:4000/api/internal/ingest
```

(This endpoint only exists when `NODE_ENV` is not `production`.)

## Deployment

Deployed via the `render.yaml` Blueprint at the repo root: one Web Service
running the API with ingestion scheduled in-process, a Static Site for the
frontend, and a Postgres database. `NEWS_API_KEY`, `WEB_ORIGIN`, and
`VITE_API_URL` are set manually in the Render dashboard after the services
first exist (Render can't wire public URLs between services before they're
created).

Render's free Postgres plan expires 30 days after creation — see the comments
in `render.yaml` if reviving this deployment after that window.
