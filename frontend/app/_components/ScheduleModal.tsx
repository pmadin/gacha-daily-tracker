'use client';

import { useState } from 'react';
import { saveSchedule, deleteSchedule } from '../_lib/api';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface ScheduleFormData {
  days_of_week: number[];
  window_start: string;
  window_end: string;
  hook_notifications: boolean;
}

interface Props {
  game: { game_id: number; game_name: string; server: string };
  existingSchedule: ScheduleFormData | null;
  token: string;
  onSave: (data: ScheduleFormData & { game_id: number }) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ScheduleModal({ game, existingSchedule, token, onSave, onDelete, onClose }: Props) {
  const [windowStart, setWindowStart] = useState(existingSchedule?.window_start?.slice(0, 5) ?? '19:00');
  const [windowEnd, setWindowEnd] = useState(existingSchedule?.window_end?.slice(0, 5) ?? '21:00');
  const [selectedDays, setSelectedDays] = useState<number[]>(existingSchedule?.days_of_week ?? []);
  const [hookNotifs, setHookNotifs] = useState(existingSchedule?.hook_notifications ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleDay(d: number) {
    setSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  }

  async function handleSave() {
    const startMinutes = timeToMinutes(windowStart);
    const endMinutes = timeToMinutes(windowEnd);
    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveSchedule(token, {
        game_id: game.game_id,
        days_of_week: selectedDays,
        window_start: windowStart,
        window_end: windowEnd,
        hook_notifications: hookNotifs,
      });
      onSave({
        game_id: game.game_id,
        days_of_week: selectedDays,
        window_start: windowStart,
        window_end: windowEnd,
        hook_notifications: hookNotifs,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteSchedule(token, game.game_id);
      onDelete();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              Schedule
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text2)' }}>
              {game.game_name} · {game.server}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors"
            style={{ color: 'var(--text3)' }}
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text2)' }}>
              Play window
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={windowStart}
                onChange={e => setWindowStart(e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.55)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <span className="text-xs" style={{ color: 'var(--text3)' }}>to</span>
              <input
                type="time"
                value={windowEnd}
                onChange={e => setWindowEnd(e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.55)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text2)' }}>
              Days of week
            </label>
            <div className="flex gap-1">
              {DAY_LABELS.map((day, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className="flex-1 rounded py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: selectedDays.includes(i)
                      ? 'linear-gradient(135deg, #c8913c, #e8c86a)'
                      : 'var(--surface)',
                    color: selectedDays.includes(i) ? '#0a0808' : 'var(--text3)',
                    border: `1px solid ${selectedDays.includes(i) ? 'transparent' : 'var(--border)'}`,
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--text3)' }}>
              No days selected = every day
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={hookNotifs}
              onChange={e => setHookNotifs(e.target.checked)}
              style={{ accentColor: '#c8913c' }}
            />
            <div>
              <span className="text-sm" style={{ color: 'var(--text2)' }}>
                Notify me when this play window starts
              </span>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--text3)' }}>
                Overrides the game&apos;s reset reminder for this schedule
              </p>
            </div>
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #c8913c, #e8c86a)', color: '#0a0808' }}
            >
              {saving ? 'Saving…' : 'Save Schedule'}
            </button>
            {existingSchedule && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function timeToMinutes(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}
