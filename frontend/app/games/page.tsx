import type { Game } from '../_lib/api';
import GamesClient from './GamesClient';

const PAGE_SIZE = 48;

async function fetchInitialGames(): Promise<{ games: Game[]; total: number }> {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${api}/gdt/games?limit=${PAGE_SIZE}&offset=0`, {
      cache: 'no-store',
    });
    if (!res.ok) return { games: [], total: 0 };
    const data = await res.json();
    return { games: data.games ?? [], total: data.total ?? 0 };
  } catch {
    return { games: [], total: 0 };
  }
}

export default async function GamesPage() {
  const { games, total } = await fetchInitialGames();
  return <GamesClient initialGames={games} initialTotal={total} />;
}
