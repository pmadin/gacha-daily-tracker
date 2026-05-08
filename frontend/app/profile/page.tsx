'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_context/AuthContext';
import { deleteAccount } from '../_lib/api';

const ROLE_LABELS: Record<number, string> = {
  1: 'User',
  2: 'Premium',
  3: 'Admin',
  4: 'Owner',
};

export default function ProfilePage() {
  const router = useRouter();
  const { token, user, logout, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) setIdentifier(user.username);
  }, [user]);

  if (isLoading || !user) return null;

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const identifierMatch =
      identifier.trim().toLowerCase() === user!.username.toLowerCase() ||
      identifier.trim().toLowerCase() === user!.email.toLowerCase();

    if (!identifierMatch) {
      setError('Username or email does not match your account.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    if (!confirming) { setConfirming(true); return; }

    setLoading(true);
    try {
      await deleteAccount(token!, identifier.trim(), password);
      logout();
      router.push('/');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 403) {
        setError('Incorrect password.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete account');
      }
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = ROLE_LABELS[user.role] ?? 'User';

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-white">Profile</h1>

      {/* Account info */}
      <div className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Username</span>
          <span className="text-sm font-medium text-white">{user.username}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Email</span>
          <span className="text-sm text-zinc-300">{user.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Role</span>
          <span className="rounded-full bg-violet-600/20 px-2.5 py-0.5 text-xs font-medium text-violet-400">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
        <h2 className="mb-1 text-base font-semibold text-red-400">Delete account</h2>
        <p className="mb-5 text-sm text-zinc-500">
          This permanently deletes your account and all associated data including your game list and completion history. This cannot be undone.
        </p>

        <form onSubmit={handleDelete} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">Username or email</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">Current password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Confirm with your password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white outline-none focus:border-red-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-950 px-4 py-2.5 text-sm text-red-400">{error}</p>
          )}

          {confirming && (
            <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
              Are you sure? This action is permanent and cannot be reversed. Click again to confirm.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {confirming && (
              <button
                type="button"
                onClick={() => { setConfirming(false); setPassword(''); setError(''); }}
                className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Deleting…' : confirming ? 'Yes, delete my account' : 'Delete my account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
