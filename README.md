# GachaDailyTracker

**Never miss a daily reset again.**

A full-stack web app for tracking daily reset times across 330+ gacha games.
Built as a personal project by Peter Madin.

**Live site:** https://gachadailytracker.com
**API docs:** https://gachadailytracker-88df93607a47.herokuapp.com/gdt/api-docs/

---

## What it does

Gacha games reset daily quests and resources on a fixed schedule — miss the window
and you lose that day's rewards permanently. GachaDailyTracker lets you:

- Track reset countdowns across 330+ games in real time
- Support for 20+ server regions with full timezone awareness
- Mark games done each day, track streaks, celebrate completions
- Schedule play windows per game — set the days of the week and time range you actually play,
  and get a push notification at the start of your window instead of at the raw reset time
- Use anonymously (no account required) or sign up to sync across devices
- Browse and search the full game catalog with server filtering

---

## Version history

### V4 — Feature Platform + Frontend Redesign (May 2026)
Major feature expansion and frontend overhaul built on the V3.5 Kintsugi design system.

**Backend features**
- **Leaderboard** — public streak leaderboard with per-user opt-in visibility toggle
- **Email digest** — daily reset reminder emails via Resend, configurable send hour
- **Password reset** — tokenised forgot-password flow (30-min expiry, single-use)
- **Play scheduler** — per-game weekly schedule windows with optional push hook at window start
- **Game submissions** — users can suggest new games; admin approval/reject queue
- **Admin settings** — site-wide leaderboard enable/disable toggle via `site_settings` table
- **Streak hardening** — atomic CASE update, rate-limited to once per 60 s via `streak_last_attempted_at`
- **3NF schema cleanup** — dropped unused columns (`first_name`, `last_name`, `phone`, `is_enabled`); added indexes
- **Icon CDN migration** — icons served from CDN; `download-icons.js` script updated

**Frontend redesign**
- **Split hero layout** — `MarketingHero` replaced centered column with a two-column grid: animated
  staggered copy on the left, live game-preview panel on the right (7 randomised games from a 28-game
  pool, real GIF icons, completion progress bar)
- **Bento features section** — `FeaturesSection` rebuilt as an asymmetric bento grid (2-col, 1 px gap
  border trick) with numbered cells, tag pills, stats row, and a separated CTA callout strip
- **Auth page backgrounds** — login/register kintsugi vein SVGs now use distinct non-mirror rotations
  (`rotate(142deg)` vs `rotate(-17deg)`) so the pages look different when switching

### V3.5 — Kintsugi Design System (May 2026)
Major frontend visual redesign. No breaking changes to API or data.

- **Kintsugi gold theme** — replaced purple/violet color system with a
  black and gold palette inspired by the Japanese art of kintsugi
- **Custom kintsugi background** — AI-generated gold crack texture
  (Adobe Firefly Image 4 Ultra) used as hero and login/register backgrounds
- **New logo and favicon** — gold faceted diamond replacing the purple diamond.
  Separate favicon for main site (diamond mark) and API (gradient G)
- **Full wordmark** — navbar updated to show GachaDailyTracker with
  GachaDailyTracker in gold and Tracker in muted gold
- **Region badge system** — Americas (gold), Global (ivory), Europe (silver),
  Japan (amber red), each semantically distinct
- **Custom placeholder icon** — dashed diamond SVG replacing generic gamepad
- **Login/register vein backgrounds** — kintsugi texture fills empty space
  around centered forms, inverted mask so veins appear at edges not center
- **Backend HTML pages themed** — /gdt/ home, /gdt/status, and Swagger UI
  topbar updated to match gold palette
- **Privacy policy and Terms of Service** — rewritten with full legal content
  including age requirements, data practices, GPL-3.0 attribution, and
  governing law (Washington State)

### V3.0 — Stability & UX Pass
- Game-timezone-aware completion dates (fixed UTC vs local date bug)
- Custom drag-and-drop sort order persisted to database
- Streak tracking with confetti on daily completion
- Hybrid SSR for games browser (first 48 games server-rendered)
- Anonymous game list sync on registration
- Windowed pagination component
- Password validation checklist on register
- Profile page with username/email/password/timezone management
- Account deletion with confirmation flow

### V2.5 — Frontend Redesign
- Full Next.js frontend replacing server-rendered HTML
- Purple/dark design system (now superseded by V3.5)
- Marquee scroll for large game lists
- Countdown timers respecting local timezone
- Mobile responsive layout

### V1.0 — V2.0 — Initial builds
- Express/PostgreSQL backend API
- JWT authentication with bcrypt + HMAC pepper
- Game catalog from cicerakes/Game-Time-Master (GPL-3.0)
- Basic HTML frontend

---

## Tech stack

**Frontend**
- Next.js 16 (App Router, hybrid SSR)
- TypeScript
- Tailwind CSS v4
- @dnd-kit (drag and drop)
- Deployed on Vercel

**Backend**
- Node.js + Express
- TypeScript
- PostgreSQL (Heroku)
- JWT authentication
- Swagger / OpenAPI 3.0 docs
- Deployed on Heroku

---

## Local development

```bash
# Clone
git clone https://github.com/pmadin/GachaDailyTracker
cd GachaDailyTracker

# Backend
npm install
cp .env.example .env   # fill in DB credentials, JWT secret, etc.
npm run dev            # runs on http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev            # runs on http://localhost:3000

# Download game icons (optional — placeholder shown if missing)
node scripts/download-icons.js
```

---

## Environment variables

**Backend (.env)**
```
DATABASE_URL=
JWT_SECRET=
PASSWORD_PEPPER=
REGISTRATION_TOKEN=
FRONTEND_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
PORT=4000
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
REGISTRATION_TOKEN=    # same value as backend, server-only
```

---

## Game data

Game catalog sourced from
[cicerakes/Game-Time-Master](https://github.com/cicerakes/Game-Time-Master)
licensed under GPL-3.0. Game names, icons, and artwork are property of
their respective publishers and used for informational fan purposes only.

---

## License

Source code: GPL-3.0
See [LICENSE](./LICENSE) for details.

---

*Built by Peter Madin — University of Washington*
*Contact: pmadin@uw.edu*
