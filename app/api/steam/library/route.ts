import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const steamId = req.nextUrl.searchParams.get('steamId');
  if (!steamId) {
    return NextResponse.json({ error: 'Missing steamId' }, { status: 400 });
  }

  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=1`,
      {
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch Steam library' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ games: data?.response?.games || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
