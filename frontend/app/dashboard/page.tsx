'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../_context/AuthContext';
import {
  fetchTrackerGames,
  removeTrackerGame,
  markComplete,
  unmarkComplete,
} from '../_lib/api';
import {
  getAnonGames,
  markAnonComplete,
  unmarkAnonComplete,
  removeAnonGame,
  clearAnonGames,
} from '../_lib/storage';
import DashboardCard from '../_components/DashboardCard';
import type { DashboardGame } from '../_components/DashboardCard';
import { getNextResetMs } from '../_lib/countdown';

export default function DashboardPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [games, setGames] = useState<DashboardGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [sortBy, setSortBy] = useState<'reset' | 'alpha'>('reset');

  const loadGames = useCallback(async () => {
    setLoading(true);
    try {
      if (token) {
        const res = await fetchTrackerGames(token);
        setGames(res.games.map(g => ({
          game_id: g.game_id,
          name: g.name,
          server: g.server,
          timezone: g.timezone,
          daily_reset: g.daily_reset,
          completed_today: g.completed_today,
        })));
      } else {
        const entries = getAnonGames();
        setGames(entries.map(({ game, completedDate }) => ({
          game_id: game.id,
          name: game.name,
          server: game.server,
          timezone: game.timezone,
          daily_reset: game.daily_reset,
          completed_today: completedDate === new Date().toISOString().split('T')[0],
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) loadGames();
  }, [authLoading, loadGames]);

  const handleToggleComplete = async (gameId: number, completed: boolean) => {
    setGames(prev =>
      prev.map(g => g.game_id === gameId ? { ...g, completed_today: completed } : g)
    );
    if (token) {
      completed ? await markComplete(token, gameId) : await unmarkComplete(token, gameId);
    } else {
      completed ? markAnonComplete(gameId) : unmarkAnonComplete(gameId);
    }
  };

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    const ids = games.map(g => g.game_id);
    setGames([]);
    setConfirmClear(false);
    if (token) {
      await Promise.all(ids.map(id => removeTrackerGame(token, id).catch(() => {})));
    } else {
      clearAnonGames();
    }
  };

  const handleRemove = async (gameId: number) => {
    setGames(prev => prev.filter(g => g.game_id !== gameId));
    if (token) {
      await removeTrackerGame(token, gameId);
    } else {
      removeAnonGame(gameId);
    }
  };

  const done = games.filter(g => g.completed_today).length;
  const total = games.length;

  const sortedGames = useMemo(() => {
    return games.slice().sort((a, b) => {
      if (a.completed_today !== b.completed_today)
        return Number(a.completed_today) - Number(b.completed_today);
      if (sortBy === 'alpha')
        return a.name.localeCompare(b.name);
      return getNextResetMs(a.timezone, a.daily_reset) - getNextResetMs(b.timezone, b.daily_reset);
    });
  }, [games, sortBy]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white">My List</h1>
          {total > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <button
                onClick={() => setSortBy('reset')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortBy === 'reset'
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Reset time
              </button>
              <button
                onClick={() => setSortBy('alpha')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortBy === 'alpha'
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                A–Z
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <button
              onClick={handleClearAll}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                confirmClear
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'border border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400'
              }`}
            >
              {confirmClear ? 'Confirm clear?' : 'Clear all'}
            </button>
          )}
          <Link
            href="/"
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            + Add games
          </Link>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-zinc-400">Your list is empty.</p>
          <Link
            href="/"
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            Browse games
          </Link>
        </div>
      ) : (
        <>
          {total > 0 && (
            <div className="relative mb-4 h-6 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(done / total) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-sm">
                {done}/{total}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {sortedGames.map(game => (
              <DashboardCard
                key={game.game_id}
                game={game}
                onToggleComplete={handleToggleComplete}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
