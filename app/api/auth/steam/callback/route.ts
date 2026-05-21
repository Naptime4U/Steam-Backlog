import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Utilidad para validar la respuesta OpenID de Steam
async function validateOpenID(query: URLSearchParams) {
  const params = new URLSearchParams();
  params.set('openid.assoc_handle', query.get('openid.assoc_handle') || '');
  params.set('openid.signed', query.get('openid.signed') || '');
  params.set('openid.sig', query.get('openid.sig') || '');
  params.set('openid.ns', query.get('openid.ns') || '');
  for (const key of (query.get('openid.signed') || '').split(',')) {
    params.set(`openid.${key}`, query.get(`openid.${key}`) || '');
  }
  params.set('openid.mode', 'check_authentication');

  const res = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const text = await res.text();
  return text.includes('is_valid:true');
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams;
  const claimedId = query.get('openid.claimed_id');
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  if (!claimedId) {
    return NextResponse.redirect(`${baseUrl}/?error=steam-callback-missing-claimedid`);
  }
  // Validar respuesta OpenID
  const valid = await validateOpenID(query);
  if (!valid) {
    return NextResponse.redirect(`${baseUrl}/?error=steam-callback-invalid`);
  }
  // Extraer steamId
  const steamId = claimedId.split('/').pop();
  // Guardar steamId en cookie (o puedes crear JWT/session aquí)
  const cookieStore = await cookies();
  cookieStore.set('steamId', steamId, { path: '/', httpOnly: false });
  // Redirigir a la app
  return NextResponse.redirect(baseUrl + '/');
}
