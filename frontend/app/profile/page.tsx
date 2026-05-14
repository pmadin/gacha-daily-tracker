'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_context/AuthContext';
import {
  deleteAccount,
  fetchVapidKey,
  subscribePush,
  unsubscribePush,
  fetchNotificationPrefs,
  updateNotificationPrefs,
  applyDefaultReminder,
  updatePassword,
  updateEmail,
} from '../_lib/api';

const ROLE_LABELS: Record<number, string> = {
  1: 'User',
  2: 'Premium',
  3: 'Admin',
  4: 'Owner',
};

const OFFSET_OPTIONS = [
  { value: 15,  label: '15 minutes before' },
  { value: 60,  label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 180, label: '3 hours before' },
  { value: 240, label: '4 hours before' },
  { value: 300, label: '5 hours before' },
  { value: 360, label: '6 hours before' },
  { value: 420, label: '7 hours before' },
  { value: 480, label: '8 hours before' },
  { value: 540, label: '9 hours before' },
  { value: 600, label: '10 hours before' },
  { value: 660, label: '11 hours before' },
  { value: 720, label: '12 hours before' },
];

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export default function ProfilePage() {
  const router = useRouter();
  const { token, user, login, logout, isLoading } = useAuth();

  // Delete account state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Notification state
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifOffset, setNotifOffset] = useState(30);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState('');
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Change password state
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Change email state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) setIdentifier(user.username);
  }, [user]);

  useEffect(() => {
    setNotifSupported(
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  useEffect(() => {
    if (!token || !notifSupported) return;
    fetchNotificationPrefs(token)
      .then(p => {
        setNotifEnabled(p.enabled);
        setNotifOffset(p.default_offset);
      })
      .catch(() => {});
  }, [token, notifSupported]);

  const handleEnableNotifications = useCallback(async () => {
    setNotifLoading(true);
    setNotifError('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotifError('Notification permission was denied. Enable it in your browser settings.');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      const { publicKey } = await fetchVapidKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await subscribePush(token!, sub.toJSON() as PushSubscriptionJSON);
      setNotifEnabled(true);
    } catch (err: unknown) {
      setNotifError(err instanceof Error ? err.message : 'Failed to enable notifications');
    } finally {
      setNotifLoading(false);
    }
  }, [token]);

  const handleDisableNotifications = useCallback(async () => {
    setNotifLoading(true);
    setNotifError('');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribePush(token!, sub.endpoint);
          await sub.unsubscribe();
        }
      }
      setNotifEnabled(false);
    } catch (err: unknown) {
      setNotifError(err instanceof Error ? err.message : 'Failed to disable notifications');
    } finally {
      setNotifLoading(false);
    }
  }, [token]);

  const handleOffsetChange = useCallback(async (offset: number) => {
    setNotifOffset(offset);
    setApplyResult('');
    if (token) {
      updateNotificationPrefs(token, offset).catch(() => {});
    }
  }, [token]);

  const handleApplyDefault = useCallback(async () => {
    if (!token) return;
    setApplyLoading(true);
    setApplyResult('');
    try {
      const res = await applyDefaultReminder(token);
      setApplyResult(`Applied to ${res.updated} game${res.updated === 1 ? '' : 's'}`);
    } catch {
      setApplyResult('Failed to apply');
    } finally {
      setApplyLoading(false);
    }
  }, [token]);

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwLoading(true);
    try {
      await updatePassword(token!, user!.username, currentPw, newPw, confirmPw);
      setPwSuccess('Password updated successfully.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setShowPwForm(false);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        setPwError('Current password is incorrect.');
      } else {
        setPwError(err instanceof Error ? err.message : 'Failed to update password');
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setEmailLoading(true);
    try {
      const res = await updateEmail(token!, newEmail, emailPw);
      login(token!, { ...user!, email: res.user.email });
      setEmailSuccess('Email updated successfully.');
      setNewEmail('');
      setEmailPw('');
      setShowEmailForm(false);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        setEmailError('Password is incorrect.');
      } else if (status === 409) {
        setEmailError('Email is already in use.');
      } else {
        setEmailError(err instanceof Error ? err.message : 'Failed to update email');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  if (isLoading || !user) return null;

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    const identifierMatch =
      identifier.trim().toLowerCase() === user!.username.toLowerCase() ||
      identifier.trim().toLowerCase() === user!.email.toLowerCase();

    if (!identifierMatch) {
      setDeleteError('Username or email does not match your account.');
      return;
    }

    if (!password.trim()) {
      setDeleteError('Please enter your password.');
      return;
    }

    if (!confirming) { setConfirming(true); return; }

    setDeleteLoading(true);
    try {
      await deleteAccount(token!, identifier.trim(), password);
      logout();
      router.push('/');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 403) {
        setDeleteError('Incorrect password.');
      } else {
        setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
      }
      setConfirming(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleLabel = ROLE_LABELS[user.role] ?? 'User';

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-white">Profile</h1>

      {/* Account info */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
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

      {/* Change Password */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Password</h2>
            {pwSuccess && !showPwForm && (
              <p className="mt-0.5 text-xs text-emerald-500">{pwSuccess}</p>
            )}
          </div>
          <button
            onClick={() => { setShowPwForm(v => !v); setPwError(''); setPwSuccess(''); }}
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            {showPwForm ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showPwForm && (
          <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Current password</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">New password</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                minLength={15}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white outline-none focus:border-violet-500"
              />
              <p className="mt-1 text-xs text-zinc-600">Min 15 characters, must include uppercase, lowercase, number, and symbol</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Confirm new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>
            {pwError && (
              <p className="rounded-lg bg-red-950 px-4 py-2.5 text-sm text-red-400">{pwError}</p>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pwLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>

      {/* Change Email */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Email</h2>
            {emailSuccess && !showEmailForm && (
              <p className="mt-0.5 text-xs text-emerald-500">{emailSuccess}</p>
            )}
          </div>
          <button
            onClick={() => { setShowEmailForm(v => !v); setEmailError(''); setEmailSuccess(''); }}
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            {showEmailForm ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showEmailForm && (
          <form onSubmit={handleEmailChange} className="mt-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">New email</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Current password</label>
              <input
                type="password"
                value={emailPw}
                onChange={e => setEmailPw(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>
            {emailError && (
              <p className="rounded-lg bg-red-950 px-4 py-2.5 text-sm text-red-400">{emailError}</p>
            )}
            <button
              type="submit"
              disabled={emailLoading}
              className="w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailLoading ? 'Updating…' : 'Update email'}
            </button>
          </form>
        )}
      </div>

      {/* Push Notifications */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-1 text-base font-semibold text-white">Push Notifications</h2>
        <p className="mb-5 text-sm text-zinc-500">
          Get reminded before your daily resets, even when the app is closed.
        </p>

        {!notifSupported ? (
          <p className="text-sm text-zinc-500">
            Push notifications are not supported in this browser.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">
                {notifEnabled ? 'Reminders enabled' : 'Reminders disabled'}
              </span>
              <button
                onClick={notifEnabled ? handleDisableNotifications : handleEnableNotifications}
                disabled={notifLoading}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  notifEnabled
                    ? 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                    : 'bg-violet-600 text-white hover:bg-violet-500'
                }`}
              >
                {notifLoading ? '…' : notifEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            {notifEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Default reminder time</span>
                <select
                  value={notifOffset}
                  onChange={e => handleOffsetChange(parseInt(e.target.value, 10))}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white outline-none focus:border-violet-500"
                >
                  {OFFSET_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            {notifEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Apply default to all games</span>
                  <button
                    onClick={handleApplyDefault}
                    disabled={applyLoading}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-50"
                  >
                    {applyLoading ? '…' : `Set all to ${notifOffset < 60 ? `${notifOffset} min` : `${notifOffset / 60} hr`}`}
                  </button>
                </div>
                {applyResult && (
                  <p className="text-xs text-zinc-500">{applyResult}</p>
                )}
                <p className="text-xs text-zinc-600">
                  Per-game reminders can also be set individually from My List.
                </p>
              </div>
            )}

            {notifError && (
              <p className="rounded-lg bg-red-950 px-4 py-2.5 text-sm text-red-400">{notifError}</p>
            )}

            {isIOS && !isStandalone && (
              <p className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-xs text-zinc-400">
                On iPhone, add GachaDaily to your Home Screen first — iOS requires it for push notifications to work.
              </p>
            )}
          </div>
        )}
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

          {deleteError && (
            <p className="rounded-lg bg-red-950 px-4 py-2.5 text-sm text-red-400">{deleteError}</p>
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
                onClick={() => { setConfirming(false); setPassword(''); setDeleteError(''); }}
                className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={deleteLoading}
              className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteLoading ? 'Deleting…' : confirming ? 'Yes, delete my account' : 'Delete my account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
