# Gacha Daily Tracker API

REST API for tracking daily tasks across 330+ gacha games with timezone-aware reset timers and smart notifications.

**Status:** In active development · Private repo · Deployed on Heroku

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 18+ / TypeScript |
| Framework | Express.js |
| Database | PostgreSQL (Docker locally, Heroku Postgres remotely) |
| Auth | JWT + bcrypt + pepper |
| API Docs | Swagger / OpenAPI 3.0 |
| Game Data | [cicerakes/Game-Time-Master](https://github.com/cicerakes/Game-Time-Master) |

---

## Setup

```bash
npm install
docker-compose up -d        # start local postgres
npm run local               # start dev server on port 4000
```

Environment files:
- `.env` — local Docker DB (used by `npm run local`)
- `.env.development` — remote Heroku DB (used by `npm run dev`)
- `.env.production` — production settings

---

## NPM Scripts

```bash
npm run local       # local Docker DB (.env)
npm run dev         # remote Heroku DB (.env.development)
npm run prod        # production (.env.production)
npm run build       # compile TypeScript → dist/
npm start           # run compiled dist/

npm run db-reset    # restart Docker postgres container
npm run format:write  # auto-format with Prettier
npm run lint        # ESLint
```

---

## Database Commands

### Local Docker

```bash
# Connect to local Docker postgres
docker exec -it gacha_tracker_db psql -U developer -d gacha_tracker

# Start / stop container
docker-compose up -d
docker-compose down

# Useful psql commands
\dt                          # list all tables
SELECT * FROM table_name;    # query a table
SELECT COUNT(*) FROM games WHERE is_active = true;
```

### Remote Heroku

```bash
# Connect to Heroku postgres
heroku pg:psql postgresql-convex-93435 -a gachadailytracker

# Same psql commands apply once connected
\dt
SELECT * FROM table_name;
```

---

## API Endpoints

Base path: `/gdt`

### Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/games` | List games — supports filters: `name`, `search`, `server`, `timezone`, `reset_time`, `limit`, `offset`, `sort_by`, `order`, `includeDeleted`, `deletedOnly` |
| GET | `/games/:id` | Get game by ID |
| GET | `/games/deleted` | List soft-deleted games |
| GET | `/games/servers/list` | Server regions with game counts |
| GET | `/timezones` | All supported timezones grouped by region |
| GET | `/timezones/detect` | Auto-detect timezone from headers/IP |
| GET | `/health` | Database + backup file health check |
| GET | `/status` | HTML status page |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register (`username`, `email`, `password`, `confirmPassword`, `registrationToken`) |
| POST | `/auth/login` | Login → returns JWT (30-day) |
| PUT | `/auth/profile` | Update profile (`timezone`, `first_name`, `last_name`, `phone`) |
| PATCH | `/auth/update-password` | Change password |
| PATCH | `/auth/update-email` | Change email |
| DELETE | `/auth/account` | Delete account (irreversible) |

### Game Management (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/update/games/:id` | Update game (`daily_reset`, `timezone`, `is_active`, `reason`) |
| POST | `/update/add/game` | Add new game |
| DELETE | `/update/delete/game/:id` | Soft or permanent delete (`permanent: true/false`) |
| POST | `/update/games/import` | Import from GitHub source |

**Import body options:**
```json
{ "forceRefresh": true }           // bypass 24h cache, fetch fresh from GitHub
{ "fullReset": true, "forceRefresh": true }  // deactivate all games first, then reimport (fixes inflated counts)
```

### Admin (role 3+ required)

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/admin/users/role/:username` | Update user role (`newRole`: 1-4, `reason`) |
| GET | `/admin/users` | List all users (paginated) |
| GET | `/admin/users/search` | Search users |

**Role system:** 1=User · 2=Premium · 3=Admin · 4=Owner

---

## Database Schema

```
users          — accounts, roles, profile fields
games          — game info, reset times, timezone, source, is_active
user_games     — user ↔ game join table
daily_completions — completion tracking per user/game/date
reminder_settings — user notification preferences
```

Key behaviors:
- Games use **soft-delete** (`is_active = false`) not hard delete
- `UNIQUE(name, server)` on games — no real duplicates possible
- `ON DELETE CASCADE` on all user-related foreign keys

---

## Postman Testing

Collections are in `test/postman/`. Import all `.postman_collection.json` files plus the environment files.

**Environment variables needed:**
```
base_url              http://localhost:4000
auth                  <admin/owner JWT>
owner_token           <owner JWT>
regular_user_token    <regular user JWT>
```

**Recommended run order:**
1. `Test Auth Edge Cases` — registration/login validation
2. `Test Public Endpoints` — health, deleted games, status
3. `Test Auth Profile Management` — profile/password/email updates
4. `Test Admin Endpoints` — role management, user search
5. `Test Game Management Enhanced` — soft delete, restore, import

**Run via Newman (CLI):**
```bash
npm install -g newman

newman run "test/postman/Test Public Endpoints.postman_collection.json" \
  --environment "test/postman/Local-gacha-daily-tracker.postman_environment.json"
```

**Notes:**
- Timezone validation is **lenient** — invalid timezones auto-correct to `America/Los_Angeles` (returns 200, not 400)
- JWT tokens expire after 30 days — re-login if you get 401s

---

## Deployment

Heroku deploys from `main` branch only.

```bash
# merge dev → main, Heroku auto-deploys
git checkout main
git merge dev
git push origin main

# after deploy, reset game data on remote
POST /gdt/update/games/import  { "fullReset": true, "forceRefresh": true }
```
