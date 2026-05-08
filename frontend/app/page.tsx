'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchTrackerGames, fetchPopularGames } from './_lib/api';
import type { TrackedGame, PopularGame } from './_lib/api';
import { getAnonGames } from './_lib/storage';
import { displayServer } from './_lib/servers';
import { useAuth } from './_context/AuthContext';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  const { token, isLoading: authLoading } = useAuth();
  const [myGames, setMyGames] = useState<{ id: number; name: string; icon_name: string; server: string; done: boolean }[]>([]);
  const [popular, setPopular] = useState<PopularGame[]>([]);
  const [myGamesLoading, setMyGamesLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (token) {
      fetchTrackerGames(token)
        .then(res => {
          setMyGames(res.games.map(g => ({
            id: g.game_id,
            name: g.name,
            icon_name: g.icon_name,
            server: g.server,
            done: g.completed_today,
          })));
        })
        .catch(() => setMyGames([]))
        .finally(() => setMyGamesLoading(false));
    } else {
      const anon = getAnonGames();
      setMyGames(anon.map(e => ({
        id: e.game.id,
        name: e.game.name,
        icon_name: e.game.icon_name,
        server: e.game.server,
        done: e.completedDate === todayISO(),
      })));
      setMyGamesLoading(false);
    }
  }, [token, authLoading]);

  useEffect(() => {
    fetchPopularGames(10)
      .then(res => setPopular(res.games))
      .catch(() => setPopular([]));
  }, []);

  const hasGames = myGames.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">

      {/* My Games */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">My Games</h2>
          {hasGames && (
            <Link href="/dashboard" className="text-sm text-violet-400 transition-colors hover:text-violet-300">
              See all →
            </Link>
          )}
        </div>

        {myGamesLoading || authLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 w-28 shrink-0 animate-pulse rounded-xl bg-zinc-800" />
            ))}
          </div>
        ) : !hasGames ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-700 py-12 text-center">
            <p className="text-sm text-zinc-400">You haven&apos;t added any games yet.</p>
            <Link
              href="/games"
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Browse games
            </Link>
          </div>
        ) : myGames.length > 9 ? (
          <div className="overflow-hidden">
            <div
              className="inline-flex gap-3 animate-marquee"
              style={{ animationDuration: `${myGames.length * 2.8}s` }}
            >
              {[...myGames, ...myGames].map((g, i) => (
                <Link
                  key={`${g.id}-${i}`}
                  href="/dashboard"
                  className="group relative shrink-0 w-28 flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
                >
                  <div className="relative">
                    <img
                      src={g.icon_name ? `/icons/${g.icon_name}.gif` : '/icons/placeholder.svg'}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/placeholder.svg'; }}
                    />
                    {g.done && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="w-full truncate text-center text-xs font-medium text-zinc-300 group-hover:text-white">
                    {g.name}
                  </span>
                  <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                    {displayServer(g.server)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scroll-x-custom">
            {myGames.map(g => (
              <Link
                key={g.id}
                href="/dashboard"
                className="group relative shrink-0 w-28 flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
              >
                <div className="relative">
                  <img
                    src={g.icon_name ? `/icons/${g.icon_name}.gif` : '/icons/placeholder.svg'}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-lg object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/placeholder.svg'; }}
                  />
                  {g.done && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                      ✓
                    </span>
                  )}
                </div>
                <span className="w-full truncate text-center text-xs font-medium text-zinc-300 group-hover:text-white">
                  {g.name}
                </span>
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                  {displayServer(g.server)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Popular Games */}
      {popular.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Popular Games</h2>
          <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
            {popular.map((g, i) => (
              <Link
                key={g.id}
                href={`/games`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-800/50"
              >
                <span className="w-5 shrink-0 text-center text-sm font-semibold text-zinc-600">
                  {i + 1}
                </span>
                <img
                  src={g.icon_name ? `/icons/${g.icon_name}.gif` : '/icons/placeholder.svg'}
                  alt=""
                  width={32}
                  height={32}
                  className="shrink-0 rounded-lg object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/placeholder.svg'; }}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
                  {g.name}
                </span>
                <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                  {displayServer(g.server)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {/* About */}
      <section className="border-t border-zinc-800 pt-10">
        <h2 className="mb-2 text-lg font-semibold text-white">About Gacha Daily Tracker</h2>
        <p className="mb-6 text-sm text-zinc-400 max-w-2xl">
          Gacha Daily Tracker helps you stay on top of daily resets across 330+ gacha games — so you never miss a reward. Browse the game library, add the games you play, and check them off each day as you complete your dailies.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-2 text-violet-400 text-xl">🎮</div>
            <h3 className="mb-1 text-sm font-semibold text-white">330+ Games</h3>
            <p className="text-xs text-zinc-500">Browse a growing library of gacha games with accurate daily reset times across every server and timezone.</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-2 text-violet-400 text-xl">✅</div>
            <h3 className="mb-1 text-sm font-semibold text-white">Track Your Dailies</h3>
            <p className="text-xs text-zinc-500">Add your games to a personal list, check them off each day, and see exactly how long until the next reset.</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-2 text-violet-400 text-xl">☁️</div>
            <h3 className="mb-1 text-sm font-semibold text-white">Sync Across Devices</h3>
            <p className="text-xs text-zinc-500">Create a free account to save your list to the cloud — access it from any device without losing your progress.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-zinc-600">
          Popular games are ranked by how many players have added them to their list. Data updates in real time as users track more games.
        </p>
      </section>

    </div>
  );
}
