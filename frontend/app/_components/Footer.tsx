import Link from 'next/link';

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000') + '/gdt';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 py-6">
      <div className="mx-auto max-w-6xl px-4 space-y-2">
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between">
          <span className="text-xs text-zinc-600">
            Gacha<span className="text-violet-500">Daily</span> Tracker
          </span>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <a
              href="https://github.com/pmadin/gacha-daily-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              GitHub
            </a>
            <a
              href={API_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              API
            </a>
            <Link href="/privacy-policy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="transition-colors hover:text-white">
              Terms
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-zinc-700">
          &copy; 2026 Peter Madin &middot; Game icons from{' '}
          <a
            href="https://github.com/cicerakes/Game-Time-Master"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-zinc-500"
          >
            cicerakes/Game-Time-Master
          </a>{' '}
          (GPL-3.0)
        </p>
      </div>
    </footer>
  );
}
