'use client';

import Link from 'next/link';
import { useAuth } from '../_context/AuthContext';

const ROLE_LABELS: Record<number, string> = { 3: 'Admin', 4: 'Owner' };

export default function AdminOverviewPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Signed in as{' '}
          <span className="text-zinc-300">{user?.username}</span>
          {' · '}
          <span className="text-violet-400">{ROLE_LABELS[user?.role ?? 3]}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/games"
          className="group rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700"
        >
          <div className="mb-3 text-2xl">🎮</div>
          <h2 className="mb-1 text-base font-semibold text-white group-hover:text-violet-400 transition-colors">
            Game Management
          </h2>
          <p className="text-sm text-zinc-500">
            Add, edit, soft-delete, and restore games. Import from Game-Time-Master source. Manage icons.
          </p>
        </Link>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 opacity-50">
          <div className="mb-3 text-2xl">👥</div>
          <h2 className="mb-1 text-base font-semibold text-zinc-400">User Management</h2>
          <p className="text-sm text-zinc-500">View users, update roles, delete accounts. Coming soon.</p>
        </div>
      </div>
    </div>
  );
}
