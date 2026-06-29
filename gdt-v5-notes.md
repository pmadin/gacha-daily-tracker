# GDT V5 — Planning Notes

Running list of deferred items, ideas, and open questions for V5 scoping.
Update this file as new items come up across sessions.

---

## Deferred from V4 / V4.5

### IP Geolocation (timezone)
`getTimezoneFromIP()` in `src/services/timezoneService.ts` is currently a stub that always returns `America/Los_Angeles`. The frontend fix (sending browser timezone at registration) means real users never hit this path — only raw API/curl calls do. Not urgent, but implementing it would close the last gap in the timezone detection chain.

Candidate services (all have free tiers adequate for current volume):
- `ipapi.co` — no API key needed, 1,000 req/day
- `ip-api.com` — no API key needed, 1,000 req/min
- `ipinfo.io` — free key, 50,000 req/month

---

## New V5 Candidates

### Disposable / temp email blocking at registration
A user registered with `nogid52036@dosbee.com` (dosbee.com is a known disposable email domain). Options:

- **Option A — Domain blocklist:** Maintain a list of known temp mail domains and reject at signup. Simple but cat-and-mouse — new services appear constantly.
- **Option B — Email verification required:** Force users to verify email before account is active. Most effective gate. You already have Resend set up so infrastructure exists. Adds friction for real users.
- **Option C — Inactive account cleanup job:** Scheduled cron on Heroku that deletes accounts older than X days with zero games added and unverified/unconfirmed email. Cleans the DB automatically rather than blocking at the door.

Recommendation: Option B (email verification) is the most standard and airtight. Option C is a good complement regardless.

### Hoyolab API sync
Allow users to sync in-game daily progress automatically via the Hoyolab API (Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, etc.). Most viable first target given Hoyoverse's documented API.

Open questions:
- Which games to target first (Genshin vs HSR vs ZZZ)?
- Read-only sync vs. write (auto check-in)?
- UID / auth token UX flow — how does the user connect their Hoyolab account?
- Branch strategy — experimental branch vs. v4.5 vs. straight into V5?

---

## Open Questions for V5 Scoping
- Is email verification worth the registration friction at current user volume?
- Should Hoyolab sync be an experimental branch first or committed to as a V5 pillar?
- Any analytics-driven features from Vercel data (e.g. most tracked games, peak usage times)?
