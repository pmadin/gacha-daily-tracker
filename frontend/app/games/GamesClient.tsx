'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchGames, fetchServers, addTrackerGame, removeTrackerGame, fetchTrackerGames } from '../_lib/api';
import type { Game } from '../_lib/api';
import { addAnonGame, removeAnonGame, getAnonGameIds } from '../_lib/storage';
import { useAuth } from '../_context/AuthContext';
import GameCard from '../_components/GameCard';
import Pagination from '../_components/Pagination';
import { SERVER_GROUPS, groupToRawServers } from '../_lib/servers';
import SubmitGameModal from './SubmitGameModal';

const PAGE_SIZE = 48;

interface Props {
  initialGames: Game[];
  initialTotal: number;
}

export default function GamesClient({ initialGames, initialTotal }: Props) {
  const { token, user, isLoading: authLoading } = useAuth();
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [serverGroup, setServerGroup] = useState('');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [trackedIds, setTrackedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(initialGames.length === 0);
  const [searchInput, setSearchInput] = useState('');
  const skipFirstLoad = useRef(initialGames.length > 0);

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
    if (skipFirstLoad.current) {
      skipFirstLoad.current = false;
      return;
    }
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Games</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {total > 0 ? `${total} games` : loading ? 'Loading…' : 'No games found'}
          </p>
        </div>
        {user && (
          <button
            onClick={() => setSubmitModalOpen(true)}
            className="rounded-lg border border-[rgba(200,155,60,0.20)] px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-[rgba(200,155,60,0.45)] hover:text-white"
          >
            + Submit a Game
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Search games…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="flex-1 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none"
          style={{ border: '1px solid rgba(200,155,60,0.15)', background: 'var(--bg2)' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.55)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.15)')}
        />
        <div className="flex gap-2">
          <select
            value={serverGroup}
            onChange={e => { setServerGroup(e.target.value); setPage(0); }}
            className="flex-1 rounded-lg px-3 py-2 text-sm text-white outline-none sm:flex-none"
            style={{ border: '1px solid rgba(200,155,60,0.15)', background: 'var(--bg2)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.55)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.15)')}
          >
            <option value="">All servers</option>
            {availableGroups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #c8913c, #e8c86a)', color: '#0a0808' }}
          >
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3 rounded-xl p-4" style={{ background: 'var(--surface)' }}>
              {/* Icon + name/server */}
              <div className="flex items-start gap-2">
                <div className="h-9 w-9 shrink-0 rounded-lg" style={{ background: 'var(--surface2)' }} />
                <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
                  <div className="rounded" style={{ height: 12, width: '78%', background: 'var(--surface2)' }} />
                  <div className="rounded-full" style={{ height: 16, width: 48, background: 'var(--surface2)' }} />
                </div>
              </div>
              {/* Reset time + timezone */}
              <div className="flex flex-col gap-1">
                <div className="rounded" style={{ height: 10, width: '55%', background: 'var(--surface2)' }} />
                <div className="rounded" style={{ height: 10, width: '80%', background: 'var(--surface2)' }} />
              </div>
              {/* Add button */}
              <div className="mt-auto rounded-lg" style={{ height: 28, background: 'var(--surface2)' }} />
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">No games found.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {games.map((game, index) => (
            <GameCard
              key={game.id}
              game={game}
              isTracked={trackedIds.has(game.id)}
              onAdd={handleAdd}
              onRemove={handleRemove}
              priority={index < 10}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {submitModalOpen && token && (
        <SubmitGameModal token={token} onClose={() => setSubmitModalOpen(false)} />
      )}
    </div>
  );
}
