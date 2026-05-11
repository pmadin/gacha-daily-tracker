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
