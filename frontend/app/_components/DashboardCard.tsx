'use client';

import CountdownTimer from './CountdownTimer';
import { displayServer } from '../_lib/servers';
import { getLocalResetTime } from '../_lib/countdown';

export interface DashboardGame {
  game_id: number;
  name: string;
  server: string;
  timezone: string;
  daily_reset: string;
  icon_name: string;
  completed_today: boolean;
}

interface Props {
  game: DashboardGame;
  onToggleComplete: (gameId: number, completed: boolean) => void;
  onRemove: (gameId: number) => void;
  dragHandle?: React.ReactNode;
}

export default function DashboardCard({ game, onToggleComplete, onRemove, dragHandle }: Props) {
  const resetAt = game.completed_today ? null : getLocalResetTime(game.timezone, game.daily_reset);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors sm:gap-4 sm:px-4 ${
        game.completed_today
          ? 'border-emerald-900/60 bg-emerald-950/30'
          : 'border-zinc-800 bg-zinc-900'
      }`}
    >
      {dragHandle}

      <button
        onClick={() => onToggleComplete(game.game_id, !game.completed_today)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          game.completed_today
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-zinc-600 bg-transparent hover:border-emerald-500'
        }`}
        aria-label={game.completed_today ? 'Mark incomplete' : 'Mark complete'}
      >
        {game.completed_today && (
          <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <img
        src={game.icon_name ? `/icons/${game.icon_name}.gif` : '/icons/placeholder.svg'}
        alt=""
        width={34}
        height={34}
        className={`shrink-0 rounded-lg object-cover transition-opacity ${game.completed_today ? 'opacity-40' : ''}`}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/placeholder.svg'; }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`truncate text-sm font-medium leading-snug ${game.completed_today ? 'text-zinc-400 line-through' : 'text-white'}`}>
          {game.name}
        </span>
        <span className="text-xs text-zinc-500">{displayServer(game.server)}</span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {game.completed_today ? (
          <span className="text-xs font-medium text-emerald-500">Done</span>
        ) : (
          <>
            <CountdownTimer timezone={game.timezone} dailyReset={game.daily_reset} />
            <span className="text-xs text-zinc-600">resets {resetAt}</span>
          </>
        )}
      </div>

      <button
        onClick={() => onRemove(game.game_id)}
        className="ml-1 shrink-0 text-zinc-600 transition-colors hover:text-red-400"
        aria-label="Remove game"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
