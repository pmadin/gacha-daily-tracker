'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DashboardCard from './DashboardCard';
import type { DashboardGame } from './DashboardCard';

interface Props {
  game: DashboardGame;
  onToggleComplete: (gameId: number, completed: boolean) => void;
  onRemove: (gameId: number) => void;
  onUpdateOffset?: (gameId: number, offset: number) => void;
}

export default function SortableCard({ game, onToggleComplete, onRemove, onUpdateOffset }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: game.game_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandle = (
    <button
      {...attributes}
      {...listeners}
      className="shrink-0 cursor-grab touch-none text-zinc-700 hover:text-zinc-400 active:cursor-grabbing"
      aria-label="Drag to reorder"
      tabIndex={-1}
    >
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.2" />
        <circle cx="11" cy="4" r="1.2" />
        <circle cx="5" cy="8" r="1.2" />
        <circle cx="11" cy="8" r="1.2" />
        <circle cx="5" cy="12" r="1.2" />
        <circle cx="11" cy="12" r="1.2" />
      </svg>
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <DashboardCard
        game={game}
        onToggleComplete={onToggleComplete}
        onRemove={onRemove}
        onUpdateOffset={onUpdateOffset}
        dragHandle={dragHandle}
      />
    </div>
  );
}
