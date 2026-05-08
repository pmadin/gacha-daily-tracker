// Maps canonical dropdown group → raw server values stored in the DB
export const SERVER_GROUPS: Record<string, string[]> = {
  'Global':         ['Global'],
  'North America':  ['EN', 'America', 'Americas', 'NA', 'North America', 'US', 'America (East)', 'Americas / Europe', 'Americas & Oceania'],
  'Japan':          ['JP'],
  'Korea':          ['KR', 'Korea'],
  'China':          ['CN'],
  'Taiwan':         ['TW'],
  'Asia':           ['Asia', 'East Asia', 'SEA'],
  'Europe':         ['EU', 'Europe'],
  'South America':  ['South America'],
  'Oceania':        ['Oceania'],
};

const SERVER_DISPLAY: Record<string, string> = {
  'JP': 'Japan',
  'KR': 'Korea',
  'Korea': 'Korea',
  'CN': 'China',
  'TW': 'Taiwan',
  'EU': 'Europe',
  'Europe': 'Europe',
  'NA': 'Americas',
  'America': 'Americas',
  'Americas': 'Americas',
  'North America': 'Americas',
  'US': 'Americas',
  'America (East)': 'E. Americas',
  'Americas / Europe': 'EU/Americas',
  'Americas & Oceania': 'Americas',
  'SEA': 'SE Asia',
  'East Asia': 'E. Asia',
  'South America': 'S. America',
  'EN': 'N. America',
  'Global': 'Global',
  'Asia': 'Asia',
  'Oceania': 'Oceania',
};

export function displayServer(raw: string): string {
  return SERVER_DISPLAY[raw] ?? raw;
}

export function groupToRawServers(group: string): string[] {
  return SERVER_GROUPS[group] ?? [];
}
