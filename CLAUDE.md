# Gacha Daily Tracker — AI Context

Daily-reset tracker for 330+ gacha games. Users browse a game list, add games to a personal list, and mark daily completions. Anonymous use via localStorage; optional account creation syncs data to the DB.

**Current state:** V1 complete. Backend on Heroku, frontend deployed to Vercel on `main`.

---

## Monorepo Layout

```
gacha_tracker/
├── src/                    # Express/TypeScript backend
├── frontend/               # Next.js 16 frontend (App Router)
├── data/                   # game-data-backup.json (330+ games)
├── scripts/                # download-game-data.js, download-icons.js
├── database/init/          # 01-schema.sql
└── test/postman/           # Postman collections
```

---

## Stack

| | Tech |
|---|---|
| Backend | Node.js 18 / TypeScript / Express.js |
| Database | PostgreSQL — Docker locally, Heroku Postgres in prod |
| Auth | JWT (30-day) + bcrypt + HMAC-SHA256 pepper |
| Frontend | Next.js 16.2 / React 19 / Tailwind v4 / Vercel |

---

## Frontend — important notes

**This is Next.js 16 App Router.** APIs and conventions differ from older versions. Before writing any Next.js code, check `node_modules/next/dist/docs/`. All pages under `frontend/app/` are Server Components by default; add `'use client'` for any component using hooks or browser APIs.

**Tailwind v4** — config is `@import "tailwindcss"` in `globals.css`, not a `tailwind.config.js` file.

**Key files:**
- `frontend/app/_lib/api.ts` — typed API client; `Game` and `TrackedGame` interfaces
- `frontend/app/_lib/storage.ts` — localStorage anon list (`AnonEntry[]` stores full Game objects + `completedDate`)
- `frontend/app/_lib/countdown.ts` — `getNextResetMs(timezone, dailyReset)` uses `Intl.DateTimeFormat`
- `frontend/app/_context/AuthContext.tsx` — provides `token`, `user`, `login()`, `logout()`, `isLoading`
- `frontend/app/api/register/route.ts` — server-side proxy that injects `REGISTRATION_TOKEN`; register endpoint returns no JWT so this also auto-calls login

**Env vars (frontend):**
- `NEXT_PUBLIC_API_URL` — backend base URL (client + server)
- `REGISTRATION_TOKEN` — server-only; never sent to browser

**Icons:** 96×96 GIFs live in `frontend/public/icons/` (excluded from git via `.gitignore`). Run `node scripts/download-icons.js` to populate locally. `placeholder.svg` is committed as fallback.

---

## Backend — key notes

**Env vars:** `DATABASE_URL`, `JWT_SECRET`, `PASSWORD_PEPPER`, `REGISTRATION_TOKEN`, `FRONTEND_URL` (used in swagger contact URL)

**Routes** (all under `/gdt`):
- Public: `/games`, `/games/servers/list`, `/timezones`, `/health`, `/status`
- Auth: `/auth/register`, `/auth/login`, `/auth/profile`, `/auth/update-password`, `/auth/update-email`, `/auth/account`
- Tracker (JWT): `/tracker/games`, `/tracker/add`, `/tracker/remove/:id`, `/tracker/complete/:id`, `/tracker/uncomplete/:id`, `/tracker/bulk-sync`
- Game mgmt (JWT): `/update/games/:id`, `/update/add/game`, `/update/delete/game/:id`, `/update/games/import`
- Admin (role 3+): `/admin/users/role/:username`, `/admin/users`, `/admin/users/search`

**Role system:** 1=User · 2=Premium · 3=Admin · 4=Owner

**Game data source:** `cicerakes/Game-Time-Master` (GPL-3.0). Data in `data/game-data-backup.json` is a modified JSON export of that repo's `game-data.js`. Icons from its `game-icons/` folder.

---

## Database Schema (key tables)

```
users             — accounts, bcrypt hash, role, profile fields
games             — name, server, timezone, daily_reset, icon_name, is_active
user_games        — user ↔ game join; is_enabled
daily_completions — user_id, game_id, completion_date (UNIQUE constraint)
reminder_settings — user notification preferences
```

Games use **soft-delete** (`is_active = false`). `UNIQUE(name, server)` prevents duplicates. All user FKs have `ON DELETE CASCADE`.

---

## Dev commands

```bash
# Backend (project root)
npm run local        # Docker DB (.env)
npm run dev          # Heroku DB (.env.development)
npm run db-reset     # restart Docker postgres

# Frontend
cd frontend
npm run dev          # http://localhost:3000
node ../scripts/download-icons.js   # populate icons/ folder

# Heroku DB (connect)
heroku pg:psql -a gachadailytracker
```

---

## Key decisions / gotchas

- **Anon storage stores full Game objects**, not just IDs — avoids a pagination lookup problem where games beyond the first 48 results couldn't be found by ID alone.
- **`AuthContext.isLoading`** flag prevents race conditions on mount; always gate effects on `!authLoading`.
- **`trackedIds` re-syncs on `[token, authLoading]`** — fetches from API when logged in, reads localStorage when anon. Without this, state goes stale after login/logout.
- **Rules of Hooks**: all `useMemo`/`useCallback` must be declared before any conditional `return`.
- **Register proxy** (`frontend/app/api/register/route.ts`): the backend register endpoint returns `{ message, user }` with no JWT, so the proxy also calls login automatically.
- **`useMemo([games, sortBy])`** for dashboard sort keeps sort from re-running on every countdown tick (countdowns update internal component state, not the `games` array).