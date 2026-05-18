# Prompt 3 — Addendum: Source Name Fix + Old Route Deprecation

## Context

The DB was manually cleaned up (source names normalized, 53 deactivated games deleted).
The active count is now 353, all with `source = 'game-time-master'`.

However the root cause is still in the code. These fixes must be applied so the DB
doesn't drift back after the next import.

---

## Fix 1 — Add `source` to the upsert ON CONFLICT clause

**File:** `src/routes/admin/games.ts`

Find the bulk upsert query in `POST /admin/import/games`. The `ON CONFLICT (name, server) DO UPDATE SET` block is missing `source`. Add it:

```typescript
// Current (missing source):
ON CONFLICT (name, server) DO UPDATE SET
  timezone      = EXCLUDED.timezone,
  daily_reset   = EXCLUDED.daily_reset,
  icon_name     = EXCLUDED.icon_name,
  is_active     = true,
  last_verified = CURRENT_TIMESTAMP

// Fixed (add source):
ON CONFLICT (name, server) DO UPDATE SET
  timezone      = EXCLUDED.timezone,
  daily_reset   = EXCLUDED.daily_reset,
  icon_name     = EXCLUDED.icon_name,
  source        = EXCLUDED.source,
  is_active     = true,
  last_verified = CURRENT_TIMESTAMP
```

This ensures any existing game with an old source label gets corrected on every import.

---

## Fix 2 — Fix source label in autoImportService

**File:** `src/services/autoImportService.ts`

Find the INSERT query in `importFromLocalBackup()`. The source value being written
is `'auto-import-backup'`. Change it to `'game-time-master'`:

```typescript
// Current:
await database.query(`
  INSERT INTO games (name, server, timezone, daily_reset, icon_name, source, last_verified)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (name, server) DO NOTHING
`, [
  game.game, game.server, game.timezone, game.dailyReset, game.icon,
  'auto-import-backup',  // ← change this
  backup.lastUpdated
]);

// Fixed:
], [
  game.game, game.server, game.timezone, game.dailyReset, game.icon,
  'game-time-master',    // ← consistent with all other import paths
  backup.lastUpdated
]);
```

Also update the `ON CONFLICT DO NOTHING` to `DO UPDATE SET source = EXCLUDED.source`
so even startup re-imports normalize the label:

```typescript
ON CONFLICT (name, server) DO UPDATE SET
  source = EXCLUDED.source,
  last_verified = EXCLUDED.last_verified
```

---

## Fix 3 — Remove the old import route entirely

**File:** `src/routes/closed/close.ts`

The route `POST /update/games/import` is the original import implementation.
It has its own upsert logic with the old source label and is the root cause of
the `auto-import-backup` source name pollution. Remove it completely.

- Delete the entire route handler for `POST /games/import` including its Swagger JSDoc block
- If `gameDataService` is only imported in this file for that route, remove the import too
- If `close.ts` becomes empty or only has boilerplate after removal, delete the file entirely
  and remove it from wherever it is mounted in the main router (likely `src/app.ts` or `src/index.ts`)

Also update `README.md` — remove `POST /update/games/import` from the Game Management
routes table.

---

## Fix 4 — Add a guard to prevent future source drift

**File:** `src/routes/admin/games.ts`

After the upsert completes, add a cleanup query that normalizes any remaining
non-standard source values. This is a safety net in case any other path writes
a different source label:

```typescript
// After the upsert COMMIT, before sending the response:
await database.query(`
  UPDATE games 
  SET source = 'game-time-master'
  WHERE source != 'game-time-master' AND is_active = true
`);
```

---

## Verification

After deploying these changes, run an import from the admin panel and then verify:

```sql
SELECT DISTINCT source FROM games;
-- Should only return: game-time-master

SELECT source, is_active, COUNT(*)
FROM games
GROUP BY source, is_active
ORDER BY source;
-- Should only show game-time-master rows
```
