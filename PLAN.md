# Gacha Daily Tracker — Development Plan

**Solo project by Peter Madin**
Stack: Node.js / TypeScript / Express / PostgreSQL (Heroku) · Next.js 16 / React 19 / Tailwind v4 (Vercel)

---

## Project State

| Version | Status | Summary |
|---------|--------|---------|
| V1 | ✅ Done | Core tracking, anonymous localStorage, JWT auth, PostgreSQL backend |
| V2 | ✅ Done | Account sync, streak system, custom sort order (drag), popular games |
| V2.5 | ✅ Done | Frontend redesign, CLS fixes, mobile responsive fixes, timezone-aware completion dates |
| **V3** | 🔲 Planning | Push notifications, admin management UI, game data import pipeline |

---

## Two Core Goals (V3)

The two features that meaningfully expand what the app does (vs. polish):

1. **Push Notification System** — alert users before their daily resets
2. **Admin Management UI** — manage games, icons, and users from a proper frontend instead of raw Swagger

Everything else in V3 is supporting infrastructure for these two.

---

## V3 Feature Breakdown

### 1. Push Notification System

**How it works (browser push):**
- User clicks "Enable notifications" → browser asks permission
- On grant, browser registers a **Service Worker** (background JS, survives tab close)
- Browser generates a **push subscription** (cryptographic endpoint tied to that browser/device)
- Subscription saved to DB (`push_subscriptions` table, linked to `user_id`)
- Backend uses `web-push` npm package + VAPID keys to send push messages to the browser vendor's relay server (Google for Chrome, Mozilla for Firefox)
- Vendor server wakes up the Service Worker → Service Worker calls `showNotification()`
- User sees a native OS notification even if the site is closed

**Key constraint:** iOS requires iOS 16.4+ and the site must be added to the Home Screen for push to work. Fallback gracefully — don't block the feature on this.

**DB changes needed:**
- Drop `reminder_settings` table — exists in production but is empty, unused, and the wrong design (stores a fixed reminder time rather than per-game offsets). See Schema Audit section below.
- New table: `push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)`
- `user_games.custom_reminder_offset` already exists (minutes before reset) — use this

**Backend routes needed:**
```
POST   /gdt/notifications/subscribe      Save push subscription for user
DELETE /gdt/notifications/unsubscribe    Remove subscription
GET    /gdt/notifications/preferences    Get user's notification settings
PATCH  /gdt/notifications/preferences    Update global on/off, default offset
```

**Three notification types:**

**Type 1 — Pre-reset reminder**
- Per-game, user-configurable offset before reset
- Free number input (not presets), range 15 min – 12 hours, 5-minute increments
- Stored in `user_games.custom_reminder_offset` (minutes before reset, already exists)
- Default: off per game (0 = disabled)

**Type 2 — At-reset notification**
- Fires exactly when a game's daily reset occurs (offset = 0)
- Global toggle in user settings, **default on**
- Separate intent from Type 1 — distinct toggle even though offset would technically be 0

**Type 3 — Batch digest**
- If 2+ games in a user's list reset within the same minute, group them into one notification
- e.g. "Genshin Impact, Honkai: Star Rail, and 2 others reset now"
- Always on, not user-configurable — suppresses notification spam

**Backend worker needed:**
- A cron job (or Heroku Scheduler) that runs every minute
- Handles all three types in one pass per tick
- Sends push via `web-push` to that user's subscriptions
- Must be timezone-aware (same logic as the `completion_date` fix in V2.5)

**Frontend changes needed:**
- Notification toggle in user settings / profile page
- Per-game reminder offset on dashboard cards — free number input, 15 min – 12 hr, 5-min steps
- At-reset global toggle on profile page
- Service Worker file: `frontend/public/sw.js`

**npm packages:**
- Backend: `web-push` + `@types/web-push`
- Generate VAPID keys once: `npx web-push generate-vapid-keys` → store in env vars

---

### 2. Admin Management UI (`/admin`)

**Security model:**
- Frontend: redirect non-admins (role < 3) away from `/admin` — UX only
- Real security: all admin API routes already check `role >= 3` on the backend
- A user cannot gain admin access by finding the URL — the backend enforces it

**Pages/sections within `/admin`:**

#### 2a. Game Management
CRUD for the games table. What's currently only possible via Swagger.

```
GET    /gdt/admin/games              List all games (including soft-deleted)
POST   /gdt/admin/games              Add a single game
PATCH  /gdt/admin/games/:id          Update game fields (name, server, timezone, reset time)
DELETE /gdt/admin/games/:id          Soft delete (sets is_active = false)
DELETE /gdt/admin/games/:id/hard     Hard delete (permanent, requires owner role)
POST   /gdt/admin/games/:id/restore  Restore soft-deleted game
```

Frontend UI: searchable/filterable table, inline edit or modal form, soft-delete toggle, hard-delete confirmation modal.

#### 2b. Icon Management
Three separate flows:

**Bulk import from source repo** (replaces the manual JS script):
```
POST /gdt/admin/import/games    Pull game data + icons from Game-Time-Master GitHub repo
                                 Returns: { added, updated, skipped, icons_fetched, icons_missing }
```

**Patch missing icons** (targeted re-fetch, doesn't touch game data):
```
POST /gdt/admin/import/icons/patch   Re-fetch icons only for games where icon file is missing
                                      Returns: { fetched, still_missing }
```

**Manual icon upload** (for games with no source icon or custom overrides):
```
POST /gdt/admin/games/:id/icon    Upload a GIF file directly
                                   Validation: must be GIF, 96×96px
                                   Saves to: frontend/public/icons/{icon_name}.gif
```

Frontend UI: import button with live progress/result feedback, table showing games with missing icons (red badge), upload button per game.

#### 2c. User Management (stretch — low priority)
```
GET    /gdt/admin/users          List users with role + created_at
PATCH  /gdt/admin/users/:id/role Update user role (owner only)
DELETE /gdt/admin/users/:id      Delete user account
```

---

## Schema Audit (Production vs. Init SQL)

Verified May 12, 2026 via `\dt` on Heroku Postgres. The init SQL (`database/init/01-schema.sql`) is out of sync with production.

### What's in production but missing from init SQL

| Table | Action |
|-------|--------|
| `reminder_settings` | **Drop** — empty, unused, wrong design (see below) |

`reminder_settings` schema (currently in prod):
```sql
id            SERIAL PRIMARY KEY
user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE
reminder_type VARCHAR(50) NOT NULL
is_enabled    BOOLEAN DEFAULT true
reminder_time TIME  -- stores a fixed clock time, not an offset
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Why it's being dropped:** The design stores a fixed reminder time (e.g. "8:00 PM") per user, not a per-game offset before reset. This doesn't fit the actual use case (remind me 30 min before Genshin resets at 4 AM). The correct pattern is `user_games.custom_reminder_offset` (already exists) + `push_subscriptions` (to be added).

### Claude Code prompt — fix schema drift

> Read `database/init/01-schema.sql`. The actual production database has a `reminder_settings` table that is not in the init file. It has columns: `id SERIAL PRIMARY KEY`, `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`, `reminder_type VARCHAR(50) NOT NULL`, `is_enabled BOOLEAN DEFAULT true`, `reminder_time TIME`, `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`. Add this table to `01-schema.sql` so the file accurately reflects what is currently deployed. Do not modify any existing table definitions.

### Claude Code prompt — V3 migration (run after schema drift fix)

> Create a new file `database/migrations/003_v3_notifications.sql`. It should:
> 1. Drop the `reminder_settings` table (`DROP TABLE IF EXISTS reminder_settings;`)
> 2. Create a `push_subscriptions` table with columns: `id SERIAL PRIMARY KEY`, `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`, `endpoint TEXT NOT NULL`, `p256dh TEXT NOT NULL`, `auth TEXT NOT NULL`, `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, and a unique constraint on `(user_id, endpoint)`.
> Add a comment at the top of the file explaining what this migration does and why `reminder_settings` is being dropped.

---

## Build Order (Recommended)

Tackle in this sequence to avoid blocking yourself:

```
Phase 0 — Schema housekeeping (do this first, before any V3 code)
  [ ] Run "fix schema drift" Claude Code prompt → updates 01-schema.sql
  [ ] Run "V3 migration" Claude Code prompt → creates 003_v3_notifications.sql
  [ ] Apply migration on Heroku: heroku pg:psql < database/migrations/003_v3_notifications.sql
  [ ] Verify: \dt shows push_subscriptions, reminder_settings is gone

Phase 1 — Backend foundation (notifications)
  [ ] Generate + store VAPID keys in env vars
  [ ] Create push_subscriptions table (migration)
  [ ] Build /notifications routes (subscribe, unsubscribe, preferences)
  [ ] Build the cron worker (query → send push)
  [ ] Test end-to-end with a hardcoded game + curl

Phase 2 — Frontend notifications
  [ ] Create frontend/public/sw.js (Service Worker)
  [ ] Notification permission flow in profile/settings
  [ ] Per-game offset picker on dashboard cards
  [ ] Wire to backend routes

Phase 3 — Backend admin routes
  [ ] Game CRUD routes (add, patch, soft delete, hard delete, restore)
  [ ] Bulk import route (wraps existing JS script logic)
  [ ] Icon patch route
  [ ] Manual icon upload route (with validation)

Phase 4 — Frontend /admin page
  [ ] Route guard (redirect if role < 3)
  [ ] Game management table
  [ ] Import + icon management UI
  [ ] User management table (stretch)

Phase 5 — Polish + ship
  [ ] Test notifications on real mobile (Android Chrome first, then iOS)
  [ ] Verify admin role-gating end-to-end
  [ ] Update CLAUDE.md with new routes and patterns
  [ ] Bump to V3, tag release
```

---

## Known Debt (Pre-V3)

Things to fix or decide before or during V3 — don't let these drag.

| Item | Status | Notes |
|------|--------|-------|
| Schema drift (01-schema.sql vs prod) | 🔲 Phase 0 | `reminder_settings` exists in prod but not in init SQL. Fix before V3 work starts. |
| `reminder_settings` table | 🔲 Phase 0 | Drop it — empty, unused, wrong design. Replaced by `push_subscriptions`. |
| CLS score on Vercel | 🔄 Monitoring | Fix deployed May 9. Vercel data is mostly pre-fix. Re-check after May 16. |
| Mobile nav (hamburger) | ✅ Fixed in V2.5 | Deployed |
| Games search bar overflow on mobile | ✅ Fixed in V2.5 | Deployed |
| Feature cards crushing on small phones | ✅ Fixed in V2.5 | Deployed |
| iOS push notification support | ⚠️ Constraint | Requires iOS 16.4+ and Add to Home Screen. Degrade gracefully. |
| Icon source gaps | 🔲 V3 | Some games in DB have no icon in source repo yet. Patch route handles this. |

---

## File Reference for V3 Work

```
Backend (new/modified):
  database/init/01-schema.sql              Fix — add reminder_settings to match prod (then drop it in migration)
  database/migrations/003_v3_notifications.sql  New — drop reminder_settings, add push_subscriptions
  src/routes/notifications.ts             New — push subscription + preferences routes
  src/routes/admin.ts                     New — game CRUD, import, icon upload
  src/workers/notificationCron.ts         New — scheduled push sender
  src/scripts/importGames.ts              Refactor — extract from JS script into callable function

Frontend (new/modified):
  frontend/public/sw.js                    New — Service Worker
  frontend/app/admin/page.tsx              New — admin dashboard
  frontend/app/admin/games/page.tsx        New — game management table
  frontend/app/admin/import/page.tsx       New — import + icon management
  frontend/app/profile/page.tsx            Modify — add notification toggle
  frontend/app/dashboard/DashboardCard.tsx Modify — add per-game offset picker
  frontend/app/_lib/api.ts                 Add notification + admin API calls
```

---

## Environment Variables Needed (V3 additions)

```
# Backend
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_CONTACT=mailto:your@email.com

# Already exists — used by icon upload route
ICONS_DIR=frontend/public/icons
```

---

## Notes / Decisions Log

- **Notification delivery:** Browser push only for V3. Email/SMS not in scope.
- **Notifications require an account:** Anon users cannot receive push notifications — no `user_id` to attach a push subscription to. Use this as a conversion prompt: show anon users on the dashboard a "Create a free account to enable reset reminders" CTA.
- **Pre-reset offset range:** 15 minutes to 12 hours (5-minute increments). Upper bound is 12 hours — half the 24-hour reset cycle — so a midnight reset can be reminded at noon, which is a reasonable waking hour. A longer upper bound would produce reminders at impractical times for daily players.
- **Admin page security:** Backend role-check is the enforcer. Frontend redirect is UX only.
- **Icon source:** Primary = Game-Time-Master GitHub repo. Secondary = manual admin upload. Uploads must be 96×96 GIF to match existing icons.
- **Hard delete:** Owner role only (`role === 4`). Admin (`role === 3`) can only soft delete.
- **Cron frequency:** Run every minute on Heroku Scheduler (or `node-cron` if staying in-process). Sends pushes within 1-minute accuracy.
- **Service Worker scope:** Register at `/` so it covers all pages. Notification click should open the app or focus existing tab.
