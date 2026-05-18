# Prompt 2 — Icon Proxy Fix + Import UX Improvements

## Context

This is the GachaDailyTracker project. The backend is Express/TypeScript deployed on Heroku. The frontend is Next.js deployed on Vercel.

**Current problem:**
- Icons are 96×96 GIFs sourced from the open-source repo `cicerakes/Game-Time-Master` (GPL-3.0)
- Icons are currently served from `/icons/${icon_name}.gif` which points to `frontend/public/icons/`
- This folder is in `.gitignore` so icons are never committed to git
- The Heroku dyno has an ephemeral filesystem — any icons downloaded via the admin "Patch Icons" button are wiped on every deploy or restart
- The fix: serve icons directly from GitHub raw URLs so no local files, no git commits, and no dyno storage are needed
- When the upstream repo adds new game icons, they automatically work after an import — no git push required

**Secondary problem:**
- The admin panel shows a game count (`{total} total`) that reflects ALL rows in the `games` table, not just active ones
- This makes the count misleading (shows 353 when only ~341 are active)

---

## Task 1 — Update Icon URLs Across the Frontend

Update every `<img>` tag that currently uses `/icons/${game.icon_name}.gif` to instead use the GitHub raw URL.

**New base URL:**
```
https://raw.githubusercontent.com/cicerakes/Game-Time-Master/master/game-icons/{icon_name}.gif
```

**Add this as a frontend environment variable:**
In `frontend/.env.local` and `frontend/.env.example`, add:
```
NEXT_PUBLIC_ICONS_BASE_URL=https://raw.githubusercontent.com/cicerakes/Game-Time-Master/master/game-icons
```

**Files to update** (all icon `<img>` src attributes):

1. `frontend/app/_components/DashboardCard.tsx`
   - Current: `` src={game.icon_name ? `/icons/${game.icon_name}.gif` : '/icons/placeholder.svg'} ``
   - New: `` src={game.icon_name ? `${process.env.NEXT_PUBLIC_ICONS_BASE_URL}/${game.icon_name}.gif` : '/placeholder.svg'} ``

2. `frontend/app/_components/GamesTray.tsx`
   - Same pattern — find the icon `<img>` and apply the same change

3. `frontend/app/_components/PopularGames.tsx`
   - Current: `` src={game.icon_name ? `/icons/${game.icon_name}.gif` : '/icons/placeholder.svg'} ``
   - Same update as above

4. `frontend/app/games/GamesClient.tsx` (or wherever the game browser card icon is rendered)
   - Find any `/icons/${...}.gif` pattern and update

5. Any other component that renders game icons — search the entire `frontend/` directory for `/icons/` and update all matches

**Placeholder fallback:**
- Move or copy `placeholder.svg` to `frontend/public/placeholder.svg` (root of public, not inside `/icons/`)
- Update all `onError` fallback srcs from `/icons/placeholder.svg` to `/placeholder.svg`

---

## Task 2 — Fix Admin Panel Game Count Display

**File:** `frontend/app/admin/games/page.tsx`

The count displayed in the header currently shows `{total} total` where `total` comes from the API response. 

Update the admin games API call (`fetchAdminGames`) to also return a separate `activeCount` field, OR update the display to show both active and total:

```tsx
// Change this:
<p className="text-sm text-zinc-500">{total} total</p>

// To this:
<p className="text-sm text-zinc-500">
  {activeCount} active · {total} total
</p>
```

**Backend change required in `src/routes/admin/games.ts`** — the `GET /admin/games` route response:

Add `activeCount` to the response:
```typescript
// Add this query alongside the existing one:
const activeResult = await database.query(
  `SELECT COUNT(*) FROM games WHERE is_active = true`
);

// Include in response:
res.json({
  games: rows,
  total: totalCount,
  activeCount: parseInt(activeResult.rows[0].count),
  page: offset / limit,
  limit,
});
```

Also update the frontend TypeScript type for the admin games API response to include `activeCount: number`.

---

## Task 3 — Add "Last Synced" to Admin Import Panel

**File:** `frontend/app/admin/games/page.tsx`

After a successful import, show when the data was last synced from upstream.

Add state:
```tsx
const [lastSynced, setLastSynced] = useState<string | null>(null);
```

After `handleImport` succeeds, set it:
```tsx
setLastSynced(new Date().toLocaleString());
```

Display it in the Data & Icons panel:
```tsx
{lastSynced && (
  <p className="mt-2 text-xs text-zinc-500">
    Last synced from upstream: <span className="text-zinc-400">{lastSynced}</span>
  </p>
)}
```

---

## Task 4 — Update .gitignore

In the root `.gitignore`, remove or comment out the line that excludes `frontend/public/icons/`. 

The icons folder can now be safely empty (or removed entirely) since icons are served from GitHub raw URLs. Add a comment explaining this:

```gitignore
# Icons are now served from GitHub raw URLs (cicerakes/Game-Time-Master).
# The local /icons/ folder is no longer needed.
# frontend/public/icons/
```

---

## Task 5 — Update the Patch Icons Button Behavior

**File:** `frontend/app/admin/games/page.tsx`

The "Patch Icons" button currently triggers a backend route that downloads GIFs to the dyno filesystem. Since icons are now served from GitHub raw directly, this button's purpose changes.

Update the button label and tooltip to reflect what it actually does now (or remove it if the backend route will be deprecated):

```tsx
// Change label from "Patch Icons" to:
"Verify Icons"

// Update tooltip/description text in the Data & Icons panel:
<p className="mt-1 text-xs text-zinc-500">
  Icons are served directly from the Game-Time-Master repository. 
  Use "Verify Icons" to check which games are missing icon references in the database.
</p>
```

**Backend:** Update `POST /admin/import/icons/patch` in `src/routes/admin/games.ts` to no longer write files to disk. Instead, return a report of which active games have a `null` or empty `icon_name` in the DB:

```typescript
// New behavior: instead of downloading files, just report missing icon_name values
const missing = result.rows.filter(g => !g.icon_name || g.icon_name.trim() === '');

res.json({
  message: 'Icon audit complete',
  missing_icon_name_count: missing.length,
  missing_games: missing.map(g => ({ id: g.id, name: g.name })),
});
```

---

## Notes

- Do not remove the `placeholder.svg` file — it is the fallback for any game without an `icon_name`
- The `NEXT_PUBLIC_ICONS_BASE_URL` env var must be added to Vercel's environment variable settings for production to work
- All `onError` handlers should remain in place — if GitHub raw is unreachable, the placeholder renders instead
- After these changes, the local `frontend/public/icons/` directory can be deleted or left empty
