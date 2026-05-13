const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface Game {
  id: number;
  name: string;
  server: string;
  timezone: string;
  daily_reset: string;
  icon_name: string;
  last_verified: string;
}

export interface TrackedGame {
  user_game_id: number;
  game_id: number;
  name: string;
  server: string;
  timezone: string;
  daily_reset: string;
  icon_name: string;
  is_enabled: boolean;
  completed_today: boolean;
  added_at: string;
  display_order: number;
  custom_reminder_offset: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  default_offset: number;
}

export interface GamesResponse {
  games: Game[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  timezone: string | null;
  role: number;
}

export interface GamesParams {
  search?: string;
  server?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? res.statusText), { status: res.status, body });
  }
  return res.json();
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchGames(params: GamesParams = {}): Promise<GamesResponse> {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.server) q.set('server', params.server);
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  if (params.sort_by) q.set('sort_by', params.sort_by);
  if (params.order) q.set('order', params.order);
  return apiFetch<GamesResponse>(`/gdt/games?${q}`);
}

export async function fetchServers(): Promise<{ servers: { server: string; game_count: string }[] }> {
  return apiFetch('/gdt/games/servers/list');
}

export async function login(identifier: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return apiFetch('/gdt/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

export async function register(
  username: string,
  email: string,
  password: string,
  confirmPassword: string,
): Promise<{ token: string; user: AuthUser }> {
  return apiFetch('/gdt/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, confirmPassword }),
  });
}

export async function fetchTrackerGames(token: string): Promise<{ games: TrackedGame[]; total: number; streak: number }> {
  return apiFetch('/gdt/tracker/games', { headers: authHeader(token) });
}

export async function checkStreak(token: string): Promise<{ streak: number }> {
  return apiFetch('/gdt/tracker/streak', { method: 'POST', headers: authHeader(token) });
}

export async function addTrackerGame(token: string, gameId: number): Promise<void> {
  await apiFetch(`/gdt/tracker/games/${gameId}`, { method: 'POST', headers: authHeader(token) });
}

export async function removeTrackerGame(token: string, gameId: number): Promise<void> {
  await apiFetch(`/gdt/tracker/games/${gameId}`, { method: 'DELETE', headers: authHeader(token) });
}

export async function markComplete(token: string, gameId: number): Promise<void> {
  await apiFetch(`/gdt/tracker/games/${gameId}/complete`, { method: 'POST', headers: authHeader(token) });
}

export async function unmarkComplete(token: string, gameId: number): Promise<void> {
  await apiFetch(`/gdt/tracker/games/${gameId}/complete`, { method: 'DELETE', headers: authHeader(token) });
}

export interface PopularGame {
  id: number;
  name: string;
  server: string;
  icon_name: string;
  add_count: number;
}

export async function fetchPopularGames(limit = 10): Promise<{ games: PopularGame[] }> {
  return apiFetch(`/gdt/games/popular?limit=${limit}`);
}

export async function updatePassword(
  token: string,
  identifier: string,
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string,
): Promise<void> {
  await apiFetch('/gdt/auth/update-password', {
    method: 'PATCH',
    headers: authHeader(token),
    body: JSON.stringify({ identifier, currentPassword, newPassword, confirmNewPassword }),
  });
}

export async function updateEmail(
  token: string,
  newEmail: string,
  password: string,
): Promise<{ user: { id: number; username: string; email: string } }> {
  return apiFetch('/gdt/auth/update-email', {
    method: 'PATCH',
    headers: authHeader(token),
    body: JSON.stringify({ newEmail, password }),
  });
}

export async function deleteAccount(token: string, identifier: string, password: string): Promise<void> {
  await apiFetch('/gdt/auth/account', {
    method: 'DELETE',
    headers: authHeader(token),
    body: JSON.stringify({ identifier, password }),
  });
}

export async function bulkAddGames(
  token: string,
  gameIds: number[],
): Promise<{ added: number; already_tracked: number; invalid_ids: number[] }> {
  return apiFetch('/gdt/tracker/games/bulk', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ gameIds }),
  });
}

export async function saveGameOrder(
  token: string,
  orders: { game_id: number; order_index: number }[],
): Promise<void> {
  await apiFetch('/gdt/tracker/order', {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify({ orders }),
  });
}

export async function updateGameReminderOffset(token: string, gameId: number, offset: number): Promise<void> {
  await apiFetch(`/gdt/tracker/games/${gameId}/reminder`, {
    method: 'PATCH',
    headers: authHeader(token),
    body: JSON.stringify({ offset }),
  });
}

export async function fetchVapidKey(): Promise<{ publicKey: string }> {
  return apiFetch('/gdt/notifications/vapid-key');
}

export async function subscribePush(token: string, subscription: PushSubscriptionJSON): Promise<void> {
  await apiFetch('/gdt/notifications/subscribe', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify(subscription),
  });
}

export async function unsubscribePush(token: string, endpoint: string): Promise<void> {
  await apiFetch('/gdt/notifications/unsubscribe', {
    method: 'DELETE',
    headers: authHeader(token),
    body: JSON.stringify({ endpoint }),
  });
}

export async function fetchNotificationPrefs(token: string): Promise<NotificationPreferences> {
  return apiFetch('/gdt/notifications/preferences', { headers: authHeader(token) });
}

export async function updateNotificationPrefs(token: string, default_offset: number): Promise<void> {
  await apiFetch('/gdt/notifications/preferences', {
    method: 'PATCH',
    headers: authHeader(token),
    body: JSON.stringify({ default_offset }),
  });
}

export async function applyDefaultReminder(token: string): Promise<{ offset: number; updated: number }> {
  return apiFetch('/gdt/notifications/apply-default', {
    method: 'POST',
    headers: authHeader(token),
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminGame {
  id: number;
  name: string;
  server: string;
  timezone: string;
  daily_reset: string;
  icon_name: string | null;
  is_active: boolean;
  source: string;
  last_verified: string;
  tracked_by: number;
}

export interface GamePayload {
  name: string;
  server: string;
  timezone: string;
  daily_reset: string;
  icon_name?: string;
}

export async function fetchAdminGames(
  token: string,
  params: { search?: string; active?: boolean; limit?: number; offset?: number } = {},
): Promise<{ games: AdminGame[]; total: number }> {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.active !== undefined) q.set('active', String(params.active));
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  return apiFetch(`/gdt/admin/games?${q}`, { headers: authHeader(token) });
}

export async function createAdminGame(token: string, data: GamePayload): Promise<{ game: AdminGame }> {
  return apiFetch('/gdt/admin/games', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify(data),
  });
}

export async function updateAdminGame(token: string, id: number, data: Partial<GamePayload>): Promise<{ game: AdminGame }> {
  return apiFetch(`/gdt/admin/games/${id}`, {
    method: 'PATCH',
    headers: authHeader(token),
    body: JSON.stringify(data),
  });
}

export async function softDeleteGame(token: string, id: number): Promise<void> {
  await apiFetch(`/gdt/admin/games/${id}`, { method: 'DELETE', headers: authHeader(token) });
}

export async function restoreGame(token: string, id: number): Promise<void> {
  await apiFetch(`/gdt/admin/games/${id}/restore`, { method: 'POST', headers: authHeader(token) });
}

export async function hardDeleteGame(token: string, id: number): Promise<void> {
  await apiFetch(`/gdt/admin/games/${id}/hard`, { method: 'DELETE', headers: authHeader(token) });
}

export async function importGames(
  token: string,
  forceRefresh = false,
): Promise<{ message: string; total: number; source: string }> {
  return apiFetch('/gdt/admin/import/games', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ forceRefresh }),
  });
}

export async function patchIcons(
  token: string,
): Promise<{ fetched: number; still_missing: number; still_missing_names: string[] }> {
  return apiFetch('/gdt/admin/import/icons/patch', {
    method: 'POST',
    headers: authHeader(token),
  });
}

export async function uploadGameIcon(token: string, gameId: number, file: File): Promise<{ icon_name: string }> {
  const form = new FormData();
  form.append('icon', file);
  const res = await fetch(`${API}/gdt/admin/games/${gameId}/icon`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? res.statusText), { status: res.status });
  }
  return res.json();
}
