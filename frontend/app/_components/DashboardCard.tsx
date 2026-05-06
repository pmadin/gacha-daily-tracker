'use client';

import CountdownTimer from './CountdownTimer';

export interface DashboardGame {
  game_id: number;
  name: string;
  server: string;
  timezone: string;
  daily_reset: string;
  completed_today: boolean;
}

interface Props {
  game: DashboardGame;
  onToggleComplete: (gameId: number, completed: boolean) => void;
  onRemove: (gameId: number) => void;
}

export default function DashboardCard({ game, onToggleComplete, onRemove }: Props) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors ${
        game.completed_today
          ? 'border-emerald-900/60 bg-emerald-950/30'
          : 'border-zinc-800 bg-zinc-900'
      }`}
    >
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

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`text-sm font-medium leading-snug ${game.completed_today ? 'text-zinc-400 line-through' : 'text-white'}`}>
          {game.name}
        </span>
        <span className="text-xs text-zinc-500">{game.server}</span>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        {game.completed_today ? (
          <span className="text-xs font-medium text-emerald-500">Done</span>
        ) : (
          <CountdownTimer timezone={game.timezone} dailyReset={game.daily_reset} />
        )}
        <span className="text-xs text-zinc-600">until reset</span>
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
