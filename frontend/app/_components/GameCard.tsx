'use client';

import type { Game } from '../_lib/api';

interface Props {
  game: Game;
  isTracked: boolean;
  onAdd: (game: Game) => void;
  onRemove: (game: Game) => void;
}

function formatResetTime(dailyReset: string): string {
  const [h, m] = dailyReset.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function GameCard({ game, isTracked, onAdd, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-white">{game.name}</h3>
        <span
          title={game.server}
          className="max-w-[6rem] shrink-0 truncate rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400"
        >
          {game.server}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-xs text-zinc-500">
        <span>Reset {formatResetTime(game.daily_reset)}</span>
        <span className="truncate">{game.timezone}</span>
      </div>

      <button
        onClick={() => (isTracked ? onRemove(game) : onAdd(game))}
        className={`mt-auto w-full rounded-lg py-1.5 text-xs font-medium transition-colors ${
          isTracked
            ? 'bg-zinc-800 text-zinc-400 hover:bg-red-950 hover:text-red-400'
            : 'bg-violet-600 text-white hover:bg-violet-500'
        }`}
      >
        {isTracked ? 'Remove' : '+ Add to list'}
      </button>
    </div>
  );
}
