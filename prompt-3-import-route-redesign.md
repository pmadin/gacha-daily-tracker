# Prompt 3 — Import Route Redesign (Live Scrape First)

## Context

This is the GachaDailyTracker backend — Express/TypeScript deployed on Heroku. The game data source is the open-source repo `cicerakes/Game-Time-Master` (GPL-3.0).

**Current problem with `gameDataService.ts`:**

The service has a 24-hour in-memory cache (`lastFetch` timestamp). When an admin clicks "Force Refresh" in the admin panel:
1. If the dyno recently restarted, `lastFetch` is null → it fetches from GitHub ✅
2. If `lastFetch` is recent (within 24hrs), `shouldFetch()` returns false → throws "Cache still valid" → falls back to `game-data-backup.json` ❌
3. `refreshFromSource()` sets `lastFetch = null` to bypass this — but `forceRefresh` in the import route calls `refreshFromSource()` correctly

The real problem is the **normal import path** (no forceRefresh) always falls back to the backup file if the cache hasn't expired, making the button feel broken even when it technically worked.

**Secondary problem:**
The `game-data-backup.json` file is committed to git and treated as the primary data source on startup. The backup should only be a true emergency fallback, not the default path.

---

## Task 1 — Refactor `gameDataService.ts`

**File:** `src/services/gameDataService.ts`

### Changes:

**1. Remove the in-memory 24hr cache entirely for admin-triggered calls.**

The cache made sense to avoid hammering GitHub on every user request, but admin import is an explicit intentional action. The cache should only apply to the auto-import that runs on server startup (`autoImportService.ts`), not to admin-triggered routes.

Split the cache logic: add a parameter or separate method for "admin refresh" that always hits GitHub:

```typescript
// New method — always fetches live, no cache check
async fetchLiveFromSource(): Promise<GameData[]> {
  const response = await axios.get(this.sourceUrl, {
    timeout: 10000,
    headers: { 'User-Agent': 'Gacha-Daily-Tracker/1.0' }
  });
  const gameData = this.parseGameDataFile(response.data);
  this.lastFetch = new Date();
  // Save as backup after successful live fetch
  await this.saveBackup(gameData);
  console.log(`✅ Live fetch: ${gameData.length} games from upstream`);
  return gameData;
}

// Keep existing getGameData() for startup auto-import (cache still applies there)
```

**2. Update `refreshFromSource()` to call `fetchLiveFromSource()`:**

```typescript
async refreshFromSource(): Promise<GameData[]> {
  return await this.fetchLiveFromSource();
}
```

**3. Add `getLastSyncInfo()` method:**

```typescript
getLastSyncInfo(): { lastFetch: Date | null; cacheExpiresAt: Date | null } {
  return {
    lastFetch: this.lastFetch,
    cacheExpiresAt: this.lastFetch 
      ? new Date(this.lastFetch.getTime() + this.cacheTimeout) 
      : null,
  };
}
```

---

## Task 2 — Update the Admin Import Route

**File:** `src/routes/admin/games.ts` — `POST /admin/import/games`

### Changes:

**1. Always use live fetch when admin clicks either import button.**

```typescript
// Replace:
const gameData = forceRefresh
  ? await gameDataService.refreshFromSource()
  : await gameDataService.getGameData();

// With:
// Admin-triggered import always fetches live from upstream.
// The backup file is only used by the auto-import on server startup.
const gameData = await gameDataService.fetchLiveFromSource();
```

**2. Add `last_synced_at` and `upstream_count` to the response:**

```typescript
res.json({
  message: 'Import complete',
  total: gameData.length,
  added,
  updated,
  source: 'upstream (live)',
  last_synced_at: new Date().toISOString(),
});
```

**3. Remove the `forceRefresh` body parameter from the route** — it's no longer needed since admin imports always go live. Keep the Swagger docs updated to reflect this.

---

## Task 3 — Update `POST /update/games/import` (the older non-admin import route)

**File:** `src/routes/closed/close.ts`

This route also calls `gameDataService`. Apply the same fix — always use `fetchLiveFromSource()` for admin/authenticated imports:

```typescript
const gameData = await gameDataService.fetchLiveFromSource();
```

Remove the `forceRefresh` / `fullReset` body parameters from the Swagger docs since `fullReset` was always risky and `forceRefresh` is now the default behavior.

Keep `fullReset` logic if it's still needed (deactivating all games before upsert), but make it clearly opt-in and add a warning comment:

```typescript
// fullReset: deactivates ALL games before import. Use only to fix inflated counts.
// Normal imports use upsert which reactivates matching games automatically.
```

---

## Task 4 — Update the Auto-Import Service (Keep Cache Here)

**File:** `src/services/autoImportService.ts`

The startup auto-import (`checkAndImportInitialData`) should continue using the backup file as its primary source. This is correct behavior — on a cold dyno start, you don't want to block startup waiting for a GitHub fetch.

Add a comment to make this clear:

```typescript
/**
 * Startup auto-import: uses local backup file as primary source.
 * This avoids blocking server startup on an external HTTP call.
 * Admins can trigger a live sync anytime via POST /admin/import/games.
 */
async checkAndImportInitialData(): Promise<void> {
  // ... existing logic unchanged
}
```

---

## Task 5 — Add Import Metadata to `GET /admin/games` Response

**File:** `src/routes/admin/games.ts` — `GET /admin/games`

Add the last sync info to the games list response so the frontend can display it:

```typescript
const syncInfo = gameDataService.getLastSyncInfo();

res.json({
  games: rows,
  total: totalCount,
  activeCount: parseInt(activeResult.rows[0].count),
  last_synced_at: syncInfo.lastFetch?.toISOString() ?? null,
});
```

---

## Task 6 — Update Swagger Documentation

Update all affected Swagger JSDoc comments to reflect:
- Import always fetches live from upstream (no `forceRefresh` needed)
- Response now includes `last_synced_at`, `added`, `updated` counts
- `fullReset` is a dangerous option, document it clearly with a warning

---

## Notes

- Do NOT remove the `game-data-backup.json` file or the `saveBackup()` method — the backup is still written after every successful live fetch and used as the startup fallback
- The `.gitignore` should keep `game-data-backup.json` excluded from git (it gets regenerated at runtime)
- The `download-game-data.js` script remains useful for local dev setup — add a comment noting it's for local/dev use only, not needed in production
- After this change, the admin "Sync from cache" button in the frontend is no longer meaningful — remove it or repurpose it to show the last sync info only
