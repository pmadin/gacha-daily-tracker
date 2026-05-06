const API_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000') + '/gdt';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center sm:flex-row sm:justify-between">
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
        </div>
      </div>
    </footer>
  );
}
