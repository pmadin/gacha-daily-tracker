import type { Game } from './api';

const ANON_LIST_KEY = 'gdt_anon_list';
const TOKEN_KEY = 'gdt_token';
const USER_KEY = 'gdt_user';

interface AnonEntry {
  game: Game;
  completedDate: string | null;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function readList(): AnonEntry[] {
  try {
    return JSON.parse(localStorage.getItem(ANON_LIST_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeList(list: AnonEntry[]): void {
  localStorage.setItem(ANON_LIST_KEY, JSON.stringify(list));
}

// --- Anon tracked games ---

export function getAnonGameIds(): number[] {
  return readList().map(e => e.game.id);
}

export function getAnonGames(): AnonEntry[] {
  return readList();
}

export function addAnonGame(game: Game): void {
  const list = readList();
  if (!list.find(e => e.game.id === game.id)) {
    writeList([...list, { game, completedDate: null }]);
  }
}

export function removeAnonGame(gameId: number): void {
  writeList(readList().filter(e => e.game.id !== gameId));
}

export function clearAnonGames(): void {
  localStorage.removeItem(ANON_LIST_KEY);
}

export function isAnonTracking(gameId: number): boolean {
  return readList().some(e => e.game.id === gameId);
}

// --- Anon completions ---

export function isAnonCompleted(gameId: number): boolean {
  const entry = readList().find(e => e.game.id === gameId);
  return entry?.completedDate === today();
}

export function markAnonComplete(gameId: number): void {
  writeList(readList().map(e =>
    e.game.id === gameId ? { ...e, completedDate: today() } : e
  ));
}

export function unmarkAnonComplete(gameId: number): void {
  writeList(readList().map(e =>
    e.game.id === gameId ? { ...e, completedDate: null } : e
  ));
}

// --- Auth token/user ---

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): import('./api').AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: import('./api').AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
