export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_logo_url?: string;
  img_icon_url?: string;
  [key: string]: any;
}

export async function fetchLibrary(steamId: string): Promise<SteamGame[]> {
  if (!steamId) return [];
  try {
    const response = await fetch(`/api/steam/library?steamId=${encodeURIComponent(steamId)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data?.games || []) as SteamGame[];
  } catch (error) {
    console.error('Error fetching library:', error);
    return [];
  }
}

export async function fetchGameDetails(appid: number): Promise<any | null> {
  try {
    const response = await fetch(`/api/steam/appdetails?appid=${appid}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.error('Error fetching game details:', error);
    return null;
  }
}

export async function fetchGameHeaders(appids: number[]): Promise<Record<number, string>> {
  const normalized = Array.from(new Set(appids.filter((appid) => Number.isInteger(appid) && appid > 0)));
  if (normalized.length === 0) return {};

  try {
    const response = await fetch(`/api/steam/appdetails?appids=${normalized.join(',')}`);
    if (!response.ok) return {};
    const payload = await response.json();
    const headers = payload?.headers || {};

    const result: Record<number, string> = {};
    for (const key of Object.keys(headers)) {
      const appid = Number(key);
      const header = headers[key];
      if (appid > 0 && typeof header === 'string' && header.length > 0) {
        result[appid] = header;
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching game headers:', error);
    return {};
  }
}

export async function fetchLibraryWithDetails(limit = 10, steamId?: string): Promise<SteamGame[]> {
  const resolvedSteamId = steamId || process.env.NEXT_PUBLIC_STEAM_USER_ID || '';
  const games = await fetchLibrary(resolvedSteamId);
  return games.slice(0, limit);
}

