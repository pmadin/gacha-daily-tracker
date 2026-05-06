'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_context/AuthContext';
import { getAnonGameIds, clearAnonGames } from '../_lib/storage';
import { bulkAddGames } from '../_lib/api';

const PASSWORD_RULES = [
  { label: 'At least 15 characters',        test: (p: string) => p.length >= 15 },
  { label: 'Lowercase letter (a–z)',         test: (p: string) => /[a-z]/.test(p) },
  { label: 'Uppercase letter (A–Z)',         test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number (0–9)',                   test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character (!@#$%…)',     test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const showChecklist = pwFocused || password.length > 0;
  const allRulesMet = PASSWORD_RULES.every(r => r.test(password));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, confirmPassword: confirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed');

      authLogin(data.token, data.user);

      const anonGames = getAnonGameIds();
      if (anonGames.length > 0) {
        try { await bulkAddGames(data.token, anonGames); clearAnonGames(); } catch { /* non-fatal — keep localStorage as fallback */ }
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">Create account</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={5}
              maxLength={50}
              pattern="[a-zA-Z0-9_\-]+"
              title="Letters, numbers, underscores, and hyphens only"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
              placeholder="Min 5 chars, letters/numbers/_-"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPwFocused(true)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
              placeholder="Min 15 characters"
            />
            {showChecklist && (
              <ul className="mt-2 space-y-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                {PASSWORD_RULES.map(rule => {
                  const met = rule.test(password);
                  return (
                    <li key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      <span className="text-[10px]">{met ? '✓' : '○'}</span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
              placeholder="••••••••"
            />
            {confirm.length > 0 && (
              <p className={`mt-1 text-xs ${confirm === password ? 'text-emerald-400' : 'text-red-400'}`}>
                {confirm === password ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-950 px-4 py-2.5 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !allRulesMet}
            className="rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
