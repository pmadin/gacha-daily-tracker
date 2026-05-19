'use client';

import { useState, useEffect } from 'react';
import { fetchLeaderboard, type LeaderboardEntry } from '../_lib/api';
import { useAuth } from '../_context/AuthContext';

const PAGE_SIZE = 50;

function fmtLastActive(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TrophyIcon({ size = 24, color = '#c8913c' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v8a6 6 0 0 1-12 0V4Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 7H4a2 2 0 0 0 0 4h2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 7h2a2 2 0 0 1 0 4h-2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 16v3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 20h8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" className="inline-block" style={{ verticalAlign: '-2px' }}>
      <path d="M6 0.5C4 3 3 5.5 3.5 8C2 6.5 2 5 2.5 4C1 6 1 7.5 1 9C1 11.2 3.2 13 6 13C8.8 13 11 11.2 11 9C11 7 9.5 5 8 3.5C8 3.5 8 5.5 7 6.5C7 6.5 8.5 4 6 0.5Z" fill="currentColor"/>
      <path d="M6 6.5C5 7.5 4.5 9 5 10.5C4.5 10 4 8.5 4.5 7.5C5 7 5.5 6.5 6 6.5Z" fill="#fed7aa" opacity="0.7"/>
    </svg>
  );
}

const MEDAL = {
  1: { color: '#e8c86a', bg: 'rgba(200,155,60,0.12)', border: 'rgba(200,155,60,0.35)', label: '1st' },
  2: { color: '#a1a1aa', bg: 'rgba(161,161,170,0.08)', border: 'rgba(161,161,170,0.25)', label: '2nd' },
  3: { color: '#d97706', bg: 'rgba(217,119,6,0.10)', border: 'rgba(217,119,6,0.25)', label: '3rd' },
} as const;

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const m = MEDAL[rank];
  const isFirst = rank === 1;
  return (
    <div
      className={`flex flex-col items-center rounded-xl px-4 py-5 text-center ${isFirst ? 'pt-4' : 'pt-6 mt-4'}`}
      style={{ background: m.bg, border: `1px solid ${m.border}`, flex: isFirst ? '0 0 38%' : '0 0 28%' }}
    >
      <span
        className="mb-2 rounded-full px-2.5 py-0.5 text-xs font-bold"
        style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}
      >
        {m.label}
      </span>
      {isFirst && (
        <div className="mb-2">
          <TrophyIcon size={28} color={m.color}/>
        </div>
      )}
      <p className="text-sm font-bold text-white truncate max-w-full">{entry.username}</p>
      <p className="mt-1 text-xs font-semibold" style={{ color: m.color }}>
        <FlameIcon /> {entry.streak} days
      </p>
      <p className="mt-1 text-xs text-zinc-500">{entry.games_tracked} games</p>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    enabled: boolean;
    leaderboard: LeaderboardEntry[];
    total: number;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard({ limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      .then(setData)
      .catch(() => setData({ enabled: false, leaderboard: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-[#18140d]"/>
          <div className="h-7 w-40 animate-pulse rounded-lg bg-[#18140d]"/>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-[#18140d]"/>
          ))}
        </div>
      </div>
    );
  }

  if (!data?.enabled) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(200,155,60,0.10)', border: '1px solid rgba(200,155,60,0.20)' }}
        >
          <TrophyIcon size={36}/>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-sm text-zinc-500">Coming soon — check back later!</p>
      </div>
    );
  }

  const { leaderboard, total } = data;
  const top3 = leaderboard.slice(0, page === 0 ? 3 : 0);
  const tableRows = page === 0 ? leaderboard.slice(3) : leaderboard;
  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE + leaderboard.length, total);
  const hasNext = rangeEnd < total;
  const hasPrev = page > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'rgba(200,155,60,0.10)', border: '1px solid rgba(200,155,60,0.20)' }}
        >
          <TrophyIcon size={20}/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Leaderboard</h1>
          <p className="text-xs text-zinc-500">
            Top streaks across all players
            {total > 0 && <> · <span style={{ color: 'var(--gold)' }}>{total}</span> players ranked</>}
          </p>
        </div>
      </div>

      {/* Top 3 podium — page 0 only */}
      {page === 0 && top3.length > 0 && (
        <div className="mb-8 flex items-end justify-center gap-3">
          {top3[1] && <PodiumCard entry={top3[1]} rank={2}/>}
          {top3[0] && <PodiumCard entry={top3[0]} rank={1}/>}
          {top3[2] && <PodiumCard entry={top3[2]} rank={3}/>}
        </div>
      )}

      {/* Table */}
      {tableRows.length === 0 && page === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          No streaks yet — be the first on the board!
        </p>
      ) : tableRows.length > 0 ? (
        <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(200,155,60,0.12)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(200,155,60,0.06)', borderBottom: '1px solid rgba(200,155,60,0.10)' }}>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Username</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Streak</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-zinc-500 sm:table-cell">Games</th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-zinc-500 md:table-cell">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((entry, i) => {
                const isMe = entry.username === user?.username;
                return (
                  <tr
                    key={entry.rank}
                    className={`transition-colors ${i % 2 === 0 ? '' : ''}`}
                    style={{
                      background: isMe ? 'rgba(200,155,60,0.06)' : 'var(--bg2)',
                      borderLeft: isMe ? '2px solid rgba(200,155,60,0.55)' : '2px solid transparent',
                      borderBottom: '1px solid rgba(200,155,60,0.06)',
                    }}
                  >
                    <td className="px-4 py-3 text-zinc-400">
                      <span className="text-xs font-mono">#{entry.rank}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {entry.username}
                      {isMe && (
                        <span className="ml-2 rounded px-1.5 py-0.5 text-xs" style={{ background: 'rgba(200,155,60,0.15)', color: 'var(--gold)' }}>
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={entry.streak >= 7 ? 'text-orange-400 font-semibold' : 'text-zinc-300'}>
                        {entry.streak >= 7 && <FlameIcon/>}
                        {' '}{entry.streak}d
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-zinc-400 sm:table-cell">{entry.games_tracked}</td>
                    <td className="hidden px-4 py-3 text-right text-zinc-500 md:table-cell">{fmtLastActive(entry.last_active)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Showing {rangeStart}–{rangeEnd} of {total} players
          </p>
          <div className="flex gap-2">
            <button
              disabled={!hasPrev}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-30"
              style={{ border: '1px solid rgba(200,155,60,0.20)', color: 'var(--text2)' }}
            >
              Previous
            </button>
            <button
              disabled={!hasNext}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-30"
              style={{ border: '1px solid rgba(200,155,60,0.20)', color: 'var(--text2)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
