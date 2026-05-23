'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../_context/AuthContext';
import {
  fetchAdminSettings,
  updateLeaderboardEnabled,
  fetchLeaderboardVisibility,
  updateLeaderboardVisibility,
} from '../../_lib/api';

function ToggleSwitch({
  enabled,
  onChange,
  loading,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={loading}
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: enabled ? 'linear-gradient(135deg, #c8913c, #e8c86a)' : 'rgba(255,255,255,0.07)',
        border: enabled ? '1px solid rgba(200,155,60,0.5)' : '1px solid rgba(200,155,60,0.18)',
      }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{
          marginTop: '4px',
          transform: `translateX(${enabled ? '24px' : '4px'})`,
        }}
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const { token } = useAuth();

  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const [selfHidden, setSelfHidden] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [visibilityMsg, setVisibilityMsg] = useState('');
  const [visibilityError, setVisibilityError] = useState('');

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetchAdminSettings(token),
      fetchLeaderboardVisibility(token),
    ])
      .then(([{ settings }, { hidden }]) => {
        setLeaderboardEnabled(settings.leaderboard_enabled === 'true');
        setSelfHidden(hidden);
      })
      .catch(() => setLoadError('Failed to load settings.'));
  }, [token]);

  const handleVisibilityToggle = async (next: boolean) => {
    if (!token) return;
    setSavingVisibility(true);
    setVisibilityMsg('');
    setVisibilityError('');
    try {
      const { message } = await updateLeaderboardVisibility(token, next);
      setSelfHidden(next);
      setVisibilityMsg(message);
      setTimeout(() => setVisibilityMsg(''), 3000);
    } catch (err: unknown) {
      setVisibilityError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleLeaderboardToggle = async (next: boolean) => {
    if (!token) return;
    setSaving(true);
    setSaveMsg('');
    setSaveError('');
    try {
      await updateLeaderboardEnabled(token, next);
      setLeaderboardEnabled(next);
      setSaveMsg(next ? 'Leaderboard enabled' : 'Leaderboard disabled');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Control site-wide features and visibility.</p>
      </div>

      {loadError && (
        <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">{loadError}</p>
      )}

      <div className="space-y-4">
        {/* Leaderboard toggle */}
        <div
          className="rounded-xl p-5"
          style={{ border: '1px solid rgba(200,155,60,0.15)', background: 'var(--bg2)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Leaderboard</p>
              <p className="mt-1 text-sm text-zinc-500">
                Show the public leaderboard page. Hide it until there are
                enough real users to make it meaningful.
              </p>
            </div>
            <ToggleSwitch
              enabled={leaderboardEnabled}
              onChange={handleLeaderboardToggle}
              loading={saving}
            />
          </div>

          {leaderboardEnabled && (
            <div
              className="mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                <path d="M12 3L2 21h20L12 3Z" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M12 10v4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="17.5" r="0.75" fill="#f59e0b"/>
              </svg>
              <span className="text-amber-400">
                Leaderboard is public. Make sure there are enough real users before enabling this.
              </span>
            </div>
          )}

          {(saveMsg || saveError) && (
            <p className={`mt-3 text-xs ${saveError ? 'text-red-400' : 'text-emerald-400'}`}>
              {saveMsg || saveError}
            </p>
          )}
        </div>

        {/* Personal leaderboard participation */}
        <div
          className="rounded-xl p-5"
          style={{ border: '1px solid rgba(200,155,60,0.15)', background: 'var(--bg2)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Your Leaderboard Participation</p>
              <p className="mt-1 text-sm text-zinc-500">
                As an admin or owner you have database access. Hiding yourself keeps
                the leaderboard trustworthy for regular users.
              </p>
            </div>
            <ToggleSwitch
              enabled={!selfHidden}
              onChange={v => handleVisibilityToggle(!v)}
              loading={savingVisibility}
            />
          </div>

          <p className="mt-3 text-xs" style={{ color: selfHidden ? '#4a3d2a' : 'var(--gold)' }}>
            {selfHidden
              ? 'You are hidden from the leaderboard.'
              : 'You are visible on the leaderboard.'}
          </p>

          {(visibilityMsg || visibilityError) && (
            <p className={`mt-2 text-xs ${visibilityError ? 'text-red-400' : 'text-emerald-400'}`}>
              {visibilityMsg || visibilityError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
