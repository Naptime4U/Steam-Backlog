import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const steamId = req.nextUrl.searchParams.get('steamid');
  const STEAM_API_KEY = process.env.STEAM_API_KEY;
  if (!steamId || !STEAM_API_KEY) {
    return NextResponse.json({}, { status: 400 });
  }
  const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`);
  const data = await res.json();
  if (data.response.players.length > 0) {
    const player = data.response.players[0];
    return NextResponse.json({
      avatar: player.avatarfull,
      personaname: player.personaname,
    });
  }
  return NextResponse.json({}, { status: 404 });
}
