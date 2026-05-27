const STEAM_API_KEY = process.env.NEXT_PUBLIC_STEAM_API_KEY!;

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  header_image?: string;
  [key: string]: any;
}

export async function fetchLibrary(steamId: string): Promise<SteamGame[]> {
  if (!steamId) return [];
  try {
    const url = `https://corsproxy.io/?https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=1`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data?.response?.games || [];
  } catch (error) {
    console.error('Error fetching library:', error);
    return [];
  }
}

export async function fetchGameDetails(appid: number): Promise<any | null> {
  try {
    const url = `https://corsproxy.io/?https://store.steampowered.com/api/appdetails?appids=${appid}`;
    const response = await fetch(url);
    const data = await response.json();
    return data[appid]?.data || null;
  } catch (error) {
    console.error('Error fetching game details:', error);
    return null;
  }
}

