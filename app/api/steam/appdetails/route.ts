import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const appidsParam = req.nextUrl.searchParams.get('appids') || req.nextUrl.searchParams.get('appid');
  if (!appidsParam) {
    return NextResponse.json({ error: 'Missing appid or appids' }, { status: 400 });
  }

  const appids = Array.from(
    new Set(
      appidsParam
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  ).slice(0, 50);

  if (appids.length === 0) {
    return NextResponse.json({ error: 'Invalid appid list' }, { status: 400 });
  }

  const appidsQuery = appids.join(',');

  try {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appidsQuery}`, {
      next: { revalidate: 21600 },
      headers: {
        'User-Agent': 'Steam-Backlog/1.0',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch Steam app details' }, { status: res.status });
    }

    const data = await res.json();
    const headersByAppid: Record<number, string | null> = {};

    for (const appid of appids) {
      headersByAppid[appid] = data?.[String(appid)]?.data?.header_image || null;
    }

    return NextResponse.json({
      headers: headersByAppid,
      data: appids.length === 1 ? data?.[String(appids[0])]?.data || null : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
