'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '../_lib/api';
import { useAuth } from '../_context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(identifier, password);
      authLogin(res.token, res.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4" style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/kintsugi-veins-login-reg.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'rotate(142deg) scale(1.5)',
          maskImage: 'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, rgba(0,0,0,0.6) 45%, black 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, rgba(0,0,0,0.6) 45%, black 75%)',
          opacity: 0.25,
          pointerEvents: 'none',
        }}
      />
      <div className="w-full max-w-sm" style={{ position: 'relative', zIndex: 1 }}>
        <h1 className="mb-6 text-center text-2xl font-bold text-white">Sign in</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Email or username</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none"
              style={{ background: 'rgba(8,8,8,0.8)', border: '1px solid rgba(200,155,60,0.18)', color: 'var(--text)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.55)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.18)')}
              placeholder="Email or username"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none"
              style={{ background: 'rgba(8,8,8,0.8)', border: '1px solid rgba(200,155,60,0.18)', color: 'var(--text)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.55)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.18)')}
              placeholder="••••••••"
            />
            <div className="mt-1 text-right">
              <Link href="/forgot-password" className="text-xs transition-colors" style={{ color: 'var(--text3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-950 px-4 py-2.5 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg py-2.5 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #c8913c, #e8c86a)', color: '#0a0808' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{' '}
          <Link href="/register" style={{ color: 'var(--gold-bright)' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
