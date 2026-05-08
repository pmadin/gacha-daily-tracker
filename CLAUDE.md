# Gacha Daily Tracker — AI Context

Daily-reset tracker for 330+ gacha games. Users browse a game list, add games to a personal list, and mark daily completions. Anonymous use via localStorage; optional account creation syncs data to the DB.

**Current state:** V2 complete. Backend on Heroku, frontend deployed to Vercel on `main`.

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

**Tailwind v4** — config is `@import "tailwindcss"` in `globals.css`, not a `tailwind.config.js` file. Custom CSS keyframes and utility classes go directly in `globals.css`.

**Key files:**
- `frontend/app/_lib/api.ts` — typed API client; `Game`, `TrackedGame`, `PopularGame`, `AuthUser` interfaces. `apiFetch` spreads `...init` BEFORE `headers` so `Content-Type` is never overwritten by auth headers.
- `frontend/app/_lib/storage.ts` — localStorage anon list (`AnonEntry[]` stores full Game objects + `completedDate`); also anon streak helpers (`getAnonStreak`, `updateAnonStreak`) and auth token/user helpers.
- `frontend/app/_lib/countdown.ts` — `getNextResetMs(timezone, dailyReset)` and `getLocalResetTime(timezone, dailyReset)` use `Intl.DateTimeFormat`.
- `frontend/app/_lib/servers.ts` — `SERVER_GROUPS` map (canonical group → raw DB values), `displayServer(raw)` for clean tags, `groupToRawServers(group)` for API filtering.
- `frontend/app/_context/AuthContext.tsx` — provides `token`, `user`, `login()`, `logout()`, `isLoading`.
- `frontend/app/api/register/route.ts` — server-side proxy: injects `REGISTRATION_TOKEN`, auto-calls login (backend register returns no JWT), and bulk-syncs anon games server-side (avoids CORS). Returns `{ token, user, synced: boolean }`.

**Pages:**
- `/` (`app/page.tsx`) — Home: "My Games" horizontal scroll (marquee when >9 games), "Popular Games" top-10 list, About section.
- `/games` (`app/games/page.tsx`) — Game browser: search, server group filter (canonical groups via `servers.ts`), paginated grid with `Pagination` component.
- `/dashboard` (`app/dashboard/page.tsx`) — My List: sort by reset/alpha/custom (drag with @dnd-kit), streak display, progress bar, confetti on all-complete.
- `/profile` (`app/profile/page.tsx`) — Account info + delete account (client-side identifier validation, 403 → "Incorrect password").
- `/login`, `/register` — Auth forms.
- `/privacy-policy`, `/terms-of-service` — Static legal pages.

**Key components:**
- `DashboardCard` — shows icon, name, server tag (`displayServer`), countdown (hidden when done), local reset time. Accepts optional `dragHandle` prop.
- `SortableCard` — wraps `DashboardCard` with `useSortable` from @dnd-kit for drag reorder.
- `GameCard` — game browser card with add/remove tracking button.
- `Pagination` — windowed page number component: shows first/last always, ±2 around current, `…` for gaps >1. Used in games browser.
- `Navbar` — logo links to `/`, nav links: Games + My List. Username dropdown (click-outside via `useRef`) with Profile link + Sign out.
- `Footer` — privacy/ToS links, copyright, GPL-3.0 attribution.

**localStorage keys:**
- `gdt_anon_list` — anon tracked games (`AnonEntry[]`)
- `gdt_token` / `gdt_user` — auth persistence
- `gdt_order` — custom dashboard sort order (`number[]` of game_ids)
- `gdt_streak` — anon streak `{ count, lastDate }` (ISO date string)
- `gdt_confetti_date` — ISO date of last confetti fire (prevents re-trigger)

**Env vars (frontend):**
- `NEXT_PUBLIC_API_URL` — backend base URL (client + server)
- `REGISTRATION_TOKEN` — server-only; never sent to browser

**Icons:** 96×96 GIFs live in `frontend/public/icons/` (excluded from git via `.gitignore`). Run `node scripts/download-icons.js` to populate locally. `placeholder.svg` is committed as fallback.

---

## Backend — key notes

**Env vars:** `DATABASE_URL`, `JWT_SECRET`, `PASSWORD_PEPPER`, `REGISTRATION_TOKEN`, `FRONTEND_URL`

**Routes** (all under `/gdt`):
- Public: `/games`, `/games/servers/list`, `/games/popular?limit=N`, `/timezones`, `/health`, `/status`
- Auth: `/auth/register`, `/auth/login`, `/auth/profile`, `/auth/update-password`, `/auth/update-email`, `/auth/account` (DELETE)
- Tracker (JWT): `/tracker/games` (GET — includes `streak` field), `/tracker/games/bulk` (POST), `/tracker/games/:id` (POST/DELETE), `/tracker/games/:id/complete` (POST/DELETE), `/tracker/streak` (POST — idempotent, atomic CASE update), `/tracker/order` (PUT — saves `display_order` via proper client transaction)
- Game mgmt (JWT): `/update/games/:id`, `/update/add/game`, `/update/delete/game/:id`, `/update/games/import`
- Admin (role 3+): `/admin/users/role/:username`, `/admin/users`, `/admin/users/search`

**Role system:** 1=User · 2=Premium · 3=Admin · 4=Owner

**Game data source:** `cicerakes/Game-Time-Master` (GPL-3.0). Data in `data/game-data-backup.json` is a modified JSON export of that repo's `game-data.js`. Icons from its `game-icons/` folder.

---

## Database Schema (key tables)

```
users             — accounts, bcrypt hash, role, profile fields,
                    streak_count INTEGER DEFAULT 0, streak_last_date DATE
games             — name, server, timezone, daily_reset, icon_name, is_active,
                    add_count INTEGER DEFAULT 0
user_games        — user ↔ game join; is_enabled, display_order INTEGER DEFAULT 0
daily_completions — user_id, game_id, completion_date (UNIQUE constraint)
reminder_settings — user notification preferences
```

Games use **soft-delete** (`is_active = false`). `UNIQUE(name, server)` prevents duplicates. All user FKs have `ON DELETE CASCADE`.

**Migrations run on Heroku (not in schema file):**
```sql
ALTER TABLE games ADD COLUMN add_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN streak_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN streak_last_date DATE;
ALTER TABLE user_games ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
```

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
- **`apiFetch` header order matters** — `...init` must spread BEFORE `headers: { 'Content-Type', ...init?.headers }` so Content-Type is never overwritten by the caller's auth header object.
- **Streak update happens in `handleToggleComplete`**, not a `useEffect` — avoids false triggers on page load or auth state change when anon games happen to be all-complete.
- **Confetti deduplication** uses `localStorage('gdt_confetti_date')` (not a ref) so it survives page refreshes.
- **Register proxy** (`frontend/app/api/register/route.ts`): backend register returns `{ message, user }` with no JWT, so the proxy calls login automatically and also bulk-syncs anon games server-to-server (bypasses CORS). Client clears anon games only if `synced === true`.
- **`PUT /tracker/order` uses `database.getClient()`** for the transaction loop — `database.query()` gets a different connection per call, so BEGIN/COMMIT/ROLLBACK would be on separate connections and have no effect.
- **Custom sort order**: loaded from localStorage on mount via `useEffect` (not lazy `useState` — avoids SSR crash). If no saved order, seeded from DB `display_order` on first load for logged-in users.
- **Server filter** in games route accepts comma-separated values (`server=JP,KR`) mapped from canonical `SERVER_GROUPS`. Empty-after-filter arrays are ignored (no filter applied) rather than returning zero results.
- **`useMemo([games, sortBy])`** for dashboard sort keeps sort from re-running on every countdown tick.
- **Marquee scroll** on home page activates when >9 tracked games: uses `inline-flex` (not `flex`) so `translateX(-50%)` references content width, not viewport width. Cards are doubled in the DOM for seamless loop.
