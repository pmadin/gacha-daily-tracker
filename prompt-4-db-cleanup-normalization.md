# Prompt 4 — DB Cleanup + 3NF Normalization
> ⚠️ Run this ONLY after reviewing the output from Prompt 1 (DB Audit).
> ⚠️ Do not run the game cleanup section until audit results are confirmed safe to delete.

---

## Context

This is the GachaDailyTracker backend — Express/TypeScript on Heroku, PostgreSQL database.

We are normalizing the schema to 3NF (Third Normal Form) and cleaning up dead columns and orphaned data. We are NOT going to BCNF — the additional complexity isn't worth it for this project's scale.

---

## Part A — Drop Unused Columns from `users` Table

### Columns to remove:
- `first_name` — never displayed in the app, not used in any feature
- `last_name` — same
- `phone` — same, also a privacy liability to store unnecessarily

### Migration SQL:
```sql
-- Run on Heroku: heroku pg:psql -a gachadailytracker
ALTER TABLE users 
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS phone;
```

### Backend files to update after migration:

**1. `src/routes/auth/profile.ts` — `PUT /auth/profile`**

Remove `first_name`, `last_name`, `phone` from:
- The destructured request body: `const { timezone } = req.body;` (only timezone remains)
- All `if (first_name !== undefined)` blocks
- The `RETURNING` clause of the UPDATE query — remove those three columns
- The Swagger `requestBody` schema — remove those three fields

**2. `src/routes/auth/profile.ts` — `GET /auth/profile`**

Update the SELECT query:
```typescript
// Remove first_name, last_name, phone from SELECT
const result = await database.query(
  `SELECT id, username, email, timezone, role, created_at FROM users WHERE id = $1`,
  [decoded.userId]
);
```

**3. `src/routes/closed/roles.ts` — `GET /admin/users`**

Update the SELECT query to remove the dropped columns:
```typescript
// Remove first_name, last_name from the SELECT
let query = `
  SELECT id, username, email, role, timezone, created_at, updated_at
  FROM users 
  WHERE 1=1
`;
```

Also remove `first_name` and `last_name` from the Swagger response schema for this route.

**4. `src/routes/auth/register.ts`** (if it references these columns)

Search for any INSERT into `users` that includes `first_name`, `last_name`, or `phone` and remove those columns.

**5. Update TypeScript types/interfaces**

Search the entire `src/` directory for any TypeScript interfaces or types that include `first_name`, `last_name`, or `phone` on a user object and remove those fields.

---

## Part B — Audit and Remove `is_enabled` from `user_games`

**First, verify it's actually unused:**
```sql
-- Check if any row has is_enabled = false
SELECT COUNT(*) FROM user_games WHERE is_enabled = false;

-- Check if any query in the codebase filters on is_enabled
-- (do a grep in the codebase for 'is_enabled')
```

If `is_enabled` is always `true` and never filtered on in any backend query:

```sql
ALTER TABLE user_games DROP COLUMN IF EXISTS is_enabled;
```

If any backend route reads or writes `is_enabled`, document it here and skip this step.

---

## Part C — Game Cleanup (Run AFTER Prompt 1 Audit is Reviewed)

> Only run this after you've reviewed the audit output and confirmed which games are safe to delete.

### Step 1 — Hard delete deactivated games with zero trackers (safe)
```sql
-- Preview first (no delete):
SELECT id, name, server, source, add_count
FROM games
WHERE is_active = false
  AND add_count = 0;

-- Then delete (only run after previewing):
DELETE FROM games
WHERE is_active = false
  AND add_count = 0;
```

### Step 2 — Handle deactivated games that users ARE tracking
From the Prompt 1 audit, Query 4 will show these. For each one, decide:
- If the game is genuinely shut down IRL → keep it deactivated, consider showing a "game unavailable" indicator to users who track it
- If it's a duplicate → merge tracking data and delete

Do NOT blindly delete these. Review them case by case.

### Step 3 — Fix the `add_count` column if it's drifted
```sql
-- Recalculate add_count from actual user_games rows
UPDATE games g
SET add_count = (
  SELECT COUNT(*) FROM user_games ug WHERE ug.game_id = g.id
);
```

This ensures `add_count` matches reality, fixing any drift from manual DB changes or account deletions.

---

## Part D — Add Missing Indexes

After cleanup, add indexes to support the new v4 features that will be built:

```sql
-- For leaderboard queries (order by streak_count)
CREATE INDEX IF NOT EXISTS idx_users_streak ON users(streak_count DESC) WHERE streak_count > 0;

-- For game submissions table (will be added in v4)
-- Placeholder — create when the table is added

-- Verify existing indexes are still valid after column drops
\d users
\d user_games
\d games
```

---

## Part E — Update the Schema Documentation

**File:** `database/init/01-schema.sql`

Update the schema file to reflect all dropped columns so it stays in sync with production:

1. Remove `first_name`, `last_name`, `phone` from the `users` CREATE TABLE block
2. Remove `is_enabled` from `user_games` if it was dropped in Part B
3. Add a comment block at the top noting when the 3NF cleanup was applied:

```sql
-- v4.0 3NF normalization (applied [DATE]):
-- Dropped from users: first_name, last_name, phone (never used in app features)
-- Dropped from user_games: is_enabled (always true, never filtered on)
```

**File:** `README.md`

Update the Database Schema section to remove the dropped columns from the documented schema.

**File:** `CLAUDE.md`

Update the schema section under "Database Schema (key tables)" to reflect the changes.

---

## Notes

- Run all SQL changes on Heroku using `heroku pg:psql -a gachadailytracker`
- Test the `PUT /auth/profile` and `GET /auth/profile` endpoints after Part A to confirm nothing breaks
- The frontend profile page (`frontend/app/profile/page.tsx`) may reference these fields — search for `first_name`, `last_name`, `phone` in the frontend and remove any UI that references them
- Do NOT drop the `streak_count`, `streak_last_date`, or `notification_offset` columns — those are active and used
- After running cleanup, run a quick sanity check:
```sql
SELECT COUNT(*) FROM games WHERE is_active = true;  -- should match upstream count (~348)
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM user_games;
```
