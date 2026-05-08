'use client';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageItems(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const windowStart = Math.max(0, current - 2);
  const windowEnd = Math.min(total - 1, current + 2);
  const items: (number | '...')[] = [];

  items.push(0);

  if (windowStart === 2) {
    items.push(1);
  } else if (windowStart > 2) {
    items.push('...');
  }

  for (let i = Math.max(1, windowStart); i <= Math.min(total - 2, windowEnd); i++) {
    items.push(i);
  }

  if (windowEnd === total - 3) {
    items.push(total - 2);
  } else if (windowEnd < total - 3) {
    items.push('...');
  }

  items.push(total - 1);

  return items;
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  const btnBase =
    'flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm transition-colors';
  const btnActive = 'border-violet-600 bg-violet-600 text-white';
  const btnInactive = 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white';
  const btnDisabled = 'border-zinc-800 text-zinc-600 cursor-not-allowed';

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className={`${btnBase} px-3 ${page === 0 ? btnDisabled : btnInactive}`}
      >
        Previous
      </button>

      {items.map((item, i) =>
        item === '...' ? (
          <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-zinc-500">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={`${btnBase} ${item === page ? btnActive : btnInactive}`}
          >
            {item + 1}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className={`${btnBase} px-3 ${page >= totalPages - 1 ? btnDisabled : btnInactive}`}
      >
        Next
      </button>
    </div>
  );
}
