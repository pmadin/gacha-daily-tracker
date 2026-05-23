'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [valid, setValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setValid(false);
      setTokenError('Missing reset token.');
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/gdt/auth/reset-password/${token}`)
      .then(r => r.json())
      .then(data => {
        setValid(data.valid);
        if (!data.valid) setTokenError(data.error ?? 'Invalid link');
      })
      .catch(() => {
        setValid(false);
        setTokenError('Failed to validate link');
      });
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gdt/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? 'Failed to reset password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text2)' }}>Validating reset link…</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ background: 'rgba(200,60,60,0.08)', border: '1px solid rgba(200,60,60,0.20)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#f87171" strokeWidth="1.5"/>
              <path d="M12 8v4" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="0.8" fill="#f87171"/>
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">Link invalid or expired</h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--text2)' }}>{tokenError}</p>
          <Link
            href="/forgot-password"
            className="rounded-lg px-5 py-2 text-sm font-medium transition-colors hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #c8913c, #e8c86a)', color: '#0a0808' }}
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ background: 'rgba(200,155,60,0.10)', border: '1px solid rgba(200,155,60,0.20)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#c8913c" strokeWidth="1.5"/>
              <path d="M8 12l3 3 5-5" stroke="#c8913c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">Password reset!</h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--text2)' }}>
            You can now sign in with your new password.
          </p>
          <Link
            href="/login"
            className="rounded-lg px-5 py-2 text-sm font-medium transition-colors hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #c8913c, #e8c86a)', color: '#0a0808' }}
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

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
          transform: 'scaleX(-1)',
          maskImage: 'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, rgba(0,0,0,0.6) 45%, black 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, rgba(0,0,0,0.6) 45%, black 75%)',
          opacity: 0.25,
          pointerEvents: 'none',
        }}
      />
      <div className="w-full max-w-sm" style={{ position: 'relative', zIndex: 1 }}>
        <h1 className="mb-2 text-center text-2xl font-bold text-white">Set a new password</h1>
        <p className="mb-6 text-center text-sm" style={{ color: 'var(--text2)' }}>
          Must be at least 8 characters.
        </p>

        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm" style={{ color: 'var(--text2)' }}>New password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="New password"
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none"
              style={{ background: 'rgba(8,8,8,0.8)', border: '1px solid rgba(200,155,60,0.18)', color: 'var(--text)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.55)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.18)')}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm" style={{ color: 'var(--text2)' }}>Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Confirm new password"
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none"
              style={{ background: 'rgba(8,8,8,0.8)', border: '1px solid rgba(200,155,60,0.18)', color: 'var(--text)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.55)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.18)')}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-950 px-4 py-2.5 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={!password || !confirm || loading}
            className="rounded-lg py-2.5 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #c8913c, #e8c86a)', color: '#0a0808' }}
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text2)' }}>Loading…</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
