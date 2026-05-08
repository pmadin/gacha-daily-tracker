'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchGames, fetchServers, addTrackerGame, removeTrackerGame, fetchTrackerGames } from '../_lib/api';
import type { Game } from '../_lib/api';
import { addAnonGame, removeAnonGame, getAnonGameIds } from '../_lib/storage';
import { useAuth } from '../_context/AuthContext';
import GameCard from '../_components/GameCard';
import Pagination from '../_components/Pagination';
import { SERVER_GROUPS, groupToRawServers } from '../_lib/servers';

const PAGE_SIZE = 48;

export default function GamesPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [serverGroup, setServerGroup] = useState('');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [trackedIds, setTrackedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchServers().then(r => {
      const rawServers = r.servers.map(s => s.server);
      const present = Object.keys(SERVER_GROUPS).filter(group =>
        groupToRawServers(group).some(raw => rawServers.includes(raw))
      );
      setAvailableGroups(present);
    });
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (token) {
      fetchTrackerGames(token)
        .then(res => setTrackedIds(new Set(res.games.map(g => g.game_id))))
        .catch(() => setTrackedIds(new Set()));
    } else {
      setTrackedIds(new Set(getAnonGameIds()));
    }
  }, [token, authLoading]);

  const load = useCallback(async (pg: number, q: string, group: string) => {
    setLoading(true);
    try {
      const rawServers = groupToRawServers(group);
      const res = await fetchGames({
        search: q || undefined,
        server: rawServers.length > 0 ? rawServers.join(',') : undefined,
        limit: PAGE_SIZE,
        offset: pg * PAGE_SIZE,
      });
      setGames(res.games);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, search, serverGroup);
  }, [load, page, search, serverGroup]);

  useEffect(() => {
    const id = setTimeout(() => {
      setPage(0);
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const handleAdd = async (game: Game) => {
    setTrackedIds(prev => new Set([...prev, game.id]));
    if (token) {
      try { await addTrackerGame(token, game.id); } catch { /* ignore 409 */ }
    } else {
      addAnonGame(game);
    }
  };

  const handleRemove = async (game: Game) => {
    setTrackedIds(prev => { const s = new Set(prev); s.delete(game.id); return s; });
    if (token) {
      try { await removeTrackerGame(token, game.id); } catch { /* ignore */ }
    } else {
      removeAnonGame(game.id);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Games</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {total > 0 ? `${total} games` : loading ? 'Loading…' : 'No games found'}
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Search games…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
        />
        <select
          value={serverGroup}
          onChange={e => { setServerGroup(e.target.value); setPage(0); }}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
        >
          <option value="">All servers</option>
          {availableGroups.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">No games found.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              isTracked={trackedIds.has(game.id)}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
