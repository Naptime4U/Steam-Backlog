import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookiesStore = await cookies();
  cookiesStore.delete('steamId');
  return NextResponse.redirect(new URL('/', req.url));
}
