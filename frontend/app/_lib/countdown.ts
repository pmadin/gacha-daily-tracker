export interface CountdownParts {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function getNextResetMs(timezone: string, dailyReset: string): number {
  const [rh, rm] = dailyReset.split(':').map(Number);
  const resetSecondsFromMidnight = rh * 3600 + rm * 60;

  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now);

  // Some locales return "24" for midnight; normalise to 0
  const rawHour = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
  const tzHour = rawHour === 24 ? 0 : rawHour;
  const tzMin = parseInt(parts.find(p => p.type === 'minute')!.value, 10);
  const tzSec = parseInt(parts.find(p => p.type === 'second')!.value, 10);

  const currentSecondsFromMidnight = tzHour * 3600 + tzMin * 60 + tzSec;

  let secsUntilReset = resetSecondsFromMidnight - currentSecondsFromMidnight;
  if (secsUntilReset <= 0) secsUntilReset += 86400;

  return secsUntilReset * 1000;
}

export function msToCountdown(ms: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalMs: ms };
}

export function getLocalResetTime(timezone: string, dailyReset: string): string {
  const ms = getNextResetMs(timezone, dailyReset);
  const resetDate = new Date(Date.now() + ms);
  return resetDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatCountdown(parts: CountdownParts): string {
  const h = String(parts.hours).padStart(2, '0');
  const m = String(parts.minutes).padStart(2, '0');
  const s = String(parts.seconds).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
