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

  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
  );
  const data = await res.json();
  const player = data?.response?.players?.[0];
  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  return NextResponse.json({
    personaname: player.personaname,
    avatarfull: player.avatarfull,
  });
}
