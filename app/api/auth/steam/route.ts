import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
  const realm = process.env.NEXTAUTH_URL;
  if (!realm) {
    return NextResponse.json({ error: 'NEXTAUTH_URL is not configured' }, { status: 500 });
  }
  const returnTo = `${realm}/api/auth/steam/callback`;

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return NextResponse.redirect(`${STEAM_OPENID_URL}?${params.toString()}`);
}
