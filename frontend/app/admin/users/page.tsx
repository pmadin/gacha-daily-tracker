'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useAuth } from '../../_context/AuthContext';
import Pagination from '../../_components/Pagination';
import {
  fetchAdminUsers,
  searchAdminUsers,
  updateUserRole,
  type AdminUser,
} from '../../_lib/api';

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<number, string> = {
  1: 'User',
  2: 'Premium',
  3: 'Admin',
  4: 'Owner',
};

const ROLE_COLORS: Record<number, string> = {
  1: 'text-zinc-400 bg-zinc-800',
  2: 'text-amber-400 bg-amber-950',
  3: 'text-[#e8c86a] bg-[rgba(200,155,60,0.15)]',
  4: 'text-[#c8913c] bg-[rgba(200,155,60,0.25)]',
};

const ROLE_TABS: { label: string; value: number | null }[] = [
  { label: 'All', value: null },
  { label: 'User', value: 1 },
  { label: 'Premium', value: 2 },
  { label: 'Admin', value: 3 },
  { label: 'Owner', value: 4 },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Role Change Modal ────────────────────────────────────────────────────────
function RoleChangeModal({
  target,
  actingRole,
  onSuccess,
  onClose,
}: {
  target: AdminUser;
  actingRole: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const availableRoles = [1, 2, 3, 4].filter(r => r < actingRole && r !== target.role);
  const [newRole, setNewRole] = useState<number>(availableRoles[0] ?? 1);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (availableRoles.length === 0) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setError('Reason must be at least 3 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateUserRole(token!, target.username, newRole, reason.trim());
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ border: '1px solid rgba(200,155,60,0.15)', background: 'var(--bg2)' }}
      >
        <h2 className="mb-1 text-base font-semibold text-white">
          Change role for {target.username}
        </h2>
        <p className="mb-5 text-sm text-zinc-500">
          Current role:{' '}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[target.role]}`}>
            {target.roleName}
          </span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">New role</label>
            <select
              value={newRole}
              onChange={e => setNewRole(Number(e.target.value))}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ border: '1px solid rgba(200,155,60,0.15)', background: 'var(--surface)' }}
            >
              {availableRoles.map(r => (
                <option key={r} value={r} style={{ background: 'var(--surface)' }}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Reason (required)</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for role change…"
              required
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ border: '1px solid rgba(200,155,60,0.15)', background: 'var(--surface)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.55)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.15)')}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[rgba(200,155,60,0.15)] py-2 text-sm text-[#9a8570] hover:text-[#f0ede8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #c8913c, #e8c86a)', color: '#0a0808' }}
            >
              {saving ? 'Updating…' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { token, user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [roleSuccessId, setRoleSuccessId] = useState<number | null>(null);

  const isSearchMode = activeSearch.length > 0;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setListError('');
    try {
      let res: { users: AdminUser[]; total: number };
      if (activeSearch) {
        res = await searchAdminUsers(token, activeSearch);
      } else {
        res = await fetchAdminUsers(token, {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
          role: roleFilter ?? undefined,
        });
      }
      setUsers(res.users);
      setTotal(res.total);
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token, activeSearch, page, roleFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setTimeout(() => {
      const q = search.trim();
      setPage(0);
      setActiveSearch(q.length >= 2 ? q : '');
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  const clearSearch = () => {
    setSearch('');
    setActiveSearch('');
    setPage(0);
  };

  const handleRoleSuccess = useCallback(async () => {
    const uid = roleTarget?.id ?? null;
    setRoleTarget(null);
    await load();
    if (uid !== null) {
      setRoleSuccessId(uid);
      setTimeout(() => setRoleSuccessId(null), 2000);
    }
  }, [roleTarget, load]);

  const canChangeRole = (target: AdminUser) => {
    if (target.role === 4) return false;
    if (target.id === user?.id) return false;
    if (target.role >= (user?.role ?? 0)) return false;
    return true;
  };

  const subtitleText = () => {
    if (isSearchMode) return `Showing top 20 results for "${activeSearch}"`;
    const parts: string[] = [`${total} total`];
    if (roleFilter) parts.push(`${ROLE_LABELS[roleFilter]}s only`);
    return parts.join(' · ');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-sm text-zinc-500">{subtitleText()}</p>
        </div>
        <div className="flex gap-2 sm:w-80">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by username or email…"
            className="flex-1 rounded-lg px-3 py-2 text-sm text-white outline-none"
            style={{ border: '1px solid rgba(200,155,60,0.15)', background: 'var(--surface)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.55)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(200,155,60,0.15)')}
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-lg border border-[rgba(200,155,60,0.15)] px-4 py-2 text-sm text-[#9a8570] hover:text-[#f0ede8]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Role filter tabs */}
      <div
        className={`mb-4 flex w-fit overflow-hidden rounded-lg border border-[rgba(200,155,60,0.15)] text-sm transition-opacity ${isSearchMode ? 'pointer-events-none opacity-40' : ''}`}
      >
        {ROLE_TABS.map(tab => (
          <button
            key={tab.label}
            onClick={() => { setRoleFilter(tab.value); setPage(0); }}
            className={`px-3 py-2 capitalize transition-colors ${
              roleFilter === tab.value
                ? 'bg-[rgba(200,155,60,0.15)] text-[#e8c86a]'
                : 'text-[#9a8570] hover:text-[#f0ede8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {listError && (
        <p className="mb-4 rounded-lg bg-red-950 px-4 py-2 text-sm text-red-400">{listError}</p>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[rgba(200,155,60,0.10)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(200,155,60,0.10)] bg-[rgba(13,11,8,0.8)] text-left text-xs text-[#4a3d2a]">
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Streak</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Timezone</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-[rgba(200,155,60,0.06)]">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 animate-pulse rounded bg-[#18140d]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500">
                  {isSearchMode
                    ? `No users found matching "${activeSearch}"`
                    : 'No users'}
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr
                  key={u.id}
                  className="border-b border-[rgba(200,155,60,0.06)] transition-colors hover:bg-[rgba(200,155,60,0.04)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{u.username}</div>
                    <div className="text-xs text-zinc-500 sm:hidden">{u.email}</div>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                      {u.roleName}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">{u.streak_count}</td>
                  <td className="hidden px-4 py-3 text-xs text-zinc-500 md:table-cell">{u.timezone}</td>
                  <td className="hidden px-4 py-3 text-xs text-zinc-500 sm:table-cell">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {canChangeRole(u) && (
                        <button
                          onClick={() => setRoleTarget(u)}
                          className="rounded px-2 py-1 text-xs text-[#9a8570] transition-colors hover:bg-[#18140d] hover:text-[#f0ede8]"
                        >
                          Change Role
                        </button>
                      )}
                      {roleSuccessId === u.id && (
                        <span className="text-xs text-emerald-400">Updated!</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (browse mode only) */}
      {!isSearchMode && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Role change modal */}
      {roleTarget && user && (
        <RoleChangeModal
          target={roleTarget}
          actingRole={user.role}
          onSuccess={handleRoleSuccess}
          onClose={() => setRoleTarget(null)}
        />
      )}
    </>
  );
}
