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
          <span style={{ color: 'var(--gold-bright)' }}>{ROLE_LABELS[user?.role ?? 3]}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/games"
          className="kintsugi-card group rounded-xl p-6 transition-colors"
          style={{ border: '1px solid rgba(200,155,60,0.12)', background: 'var(--bg2)' }}
        >
          <div className="mb-3 text-2xl">🎮</div>
          <h2 className="mb-1 text-base font-semibold text-white group-hover:text-[#e8c86a] transition-colors">
            Game Management
          </h2>
          <p className="text-sm text-zinc-500">
            Add, edit, soft-delete, and restore games. Import from Game-Time-Master source. Manage icons.
          </p>
        </Link>

        <div className="rounded-xl p-6 opacity-50" style={{ border: '1px solid rgba(200,155,60,0.10)', background: 'transparent' }}>
          <div className="mb-3 text-2xl">👥</div>
          <h2 className="mb-1 text-base font-semibold text-zinc-400">User Management</h2>
          <p className="text-sm text-zinc-500">View users, update roles, delete accounts. Coming soon.</p>
        </div>
      </div>
    </div>
  );
}
