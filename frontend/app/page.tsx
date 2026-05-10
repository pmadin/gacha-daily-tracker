'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  fetchTrackerGames,
  fetchPopularGames,
  fetchGames,
  markComplete,
  unmarkComplete,
  addTrackerGame,
  checkStreak,
} from './_lib/api';
import type { PopularGame } from './_lib/api';
import {
  getAnonGames,
  markAnonComplete,
  unmarkAnonComplete,
  addAnonGame,
  updateAnonStreak,
} from './_lib/storage';
import { useAuth } from './_context/AuthContext';
import MarketingHero from './_components/MarketingHero';
import EmptyDashboard from './_components/EmptyDashboard';
import GamesTray, { type TrayGame } from './_components/GamesTray';
import PopularGames from './_components/PopularGames';
import FeaturesSection from './_components/FeaturesSection';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  const { token, isLoading: authLoading } = useAuth();
  const [myGames, setMyGames] = useState<TrayGame[]>([]);
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
            timezone: g.timezone,
            daily_reset: g.daily_reset,
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
        timezone: e.game.timezone,
        daily_reset: e.game.daily_reset,
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

  const handleToggle = useCallback(async (gameId: number, done: boolean) => {
    if (token) {
      if (done) {
        await unmarkComplete(token, gameId);
      } else {
        await markComplete(token, gameId);
      }
    } else {
      if (done) {
        unmarkAnonComplete(gameId);
      } else {
        markAnonComplete(gameId);
      }
    }
    setMyGames(prev => prev.map(g => g.id === gameId ? { ...g, done: !done } : g));

    // Trigger streak + confetti when this toggle completes the last game
    if (!done) {
      const currentDone = myGames.filter(g => g.done).length;
      const isNowAllDone = currentDone + 1 === myGames.length && myGames.length > 0;
      if (isNowAllDone) {
        if (token) {
          checkStreak(token).catch(() => {});
        } else {
          updateAnonStreak();
        }
        const todayStr = new Date().toISOString().split('T')[0];
        if (localStorage.getItem('gdt_confetti_date') !== todayStr) {
          localStorage.setItem('gdt_confetti_date', todayStr);
          import('canvas-confetti').then(m => {
            m.default({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
          });
        }
      }
    }
  }, [token, myGames]);

  const handleAddPopular = useCallback(async (game: PopularGame) => {
    if (token) {
      await addTrackerGame(token, game.id);
      const res = await fetchTrackerGames(token);
      setMyGames(res.games.map(g => ({
        id: g.game_id,
        name: g.name,
        icon_name: g.icon_name,
        server: g.server,
        timezone: g.timezone,
        daily_reset: g.daily_reset,
        done: g.completed_today,
      })));
    } else {
      // Fetch full game data (PopularGame lacks timezone/daily_reset)
      try {
        const res = await fetchGames({ search: game.name, limit: 10 });
        const fullGame = res.games.find(g => g.id === game.id);
        if (fullGame) {
          addAnonGame(fullGame);
          setMyGames(prev => [...prev, {
            id: fullGame.id,
            name: fullGame.name,
            icon_name: fullGame.icon_name,
            server: fullGame.server,
            timezone: fullGame.timezone,
            daily_reset: fullGame.daily_reset,
            done: false,
          }]);
        }
      } catch {
        // silently fail — user can still add via /games
      }
    }
  }, [token]);

  const trackedIds = new Set(myGames.map(g => g.id));
  const isLoggedIn = !!token;
  const hasGames = myGames.length > 0;
  const loading = authLoading || myGamesLoading;

  const popContext: 'logged-out' | 'empty' | 'has-games' =
    hasGames ? 'has-games' : isLoggedIn ? 'empty' : 'logged-out';

  return (
    <>
      {/* State-dependent top section:
          - loading         → skeleton (reserves height, prevents CLS)
          - anon, no games  → MarketingHero
          - anon, has games → GamesTray (anon localStorage games)
          - auth, no games  → EmptyDashboard
          - auth, has games → GamesTray */}
      {loading ? (
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-2">
          <div style={{ minHeight: 220 }}>
            <div className="h-48 animate-pulse rounded-xl bg-zinc-800" />
          </div>
        </div>
      ) : hasGames ? (
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-2">
          <GamesTray games={myGames} onToggle={handleToggle} />
        </div>
      ) : isLoggedIn ? (
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-2">
          <EmptyDashboard />
        </div>
      ) : (
        <MarketingHero />
      )}

      {/* Popular games */}
      {popular.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 py-10">
          <PopularGames
            games={popular}
            context={popContext}
            trackedIds={trackedIds}
            onAdd={handleAddPopular}
          />
        </div>
      )}

      {/* Features / about section */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <FeaturesSection />
      </div>
    </>
  );
}
