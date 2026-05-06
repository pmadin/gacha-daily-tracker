'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../_context/AuthContext';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        pathname === href
          ? 'text-white'
          : 'text-zinc-400 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight text-white">
            <svg width="22" height="22" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="32" height="32" rx="7" fill="#7c3aed"/>
              <polygon points="16,5 7,14 16,17" fill="white" opacity="0.75"/>
              <polygon points="16,5 25,14 16,17" fill="white" opacity="0.97"/>
              <polygon points="7,14 16,27 16,17"  fill="white" opacity="0.40"/>
              <polygon points="25,14 16,17 16,27" fill="white" opacity="0.62"/>
            </svg>
            Gacha<span className="text-violet-400">Daily</span>
          </Link>
          <nav className="flex items-center gap-4">
            {navLink('/', 'Games')}
            {navLink('/dashboard', 'My List')}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? null : user ? (
            <>
              <span className="text-sm text-zinc-400">{user.username}</span>
              <button
                onClick={logout}
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
