
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Obtener steamId de la cookie
    const cookiesStore = await cookies();
    const steamId = cookiesStore.get('steamId')?.value;
    if (!steamId) {
      return NextResponse.json({ ok: false, error: 'No steamId in cookie' }, { status: 401 });
    }
    // Obtiene el backlog y completados del usuario
    const backlog = await prisma.backlog.findMany({
      where: { userSteamId: steamId },
      include: { game: true },
    });

    const headers: Record<number, string> = {};
    for (const item of backlog) {
      if (item.game?.appid && item.game?.headerUrl) {
        headers[item.game.appid] = item.game.headerUrl;
      }
    }

    return NextResponse.json({
      backlog: backlog.filter(b => b.status === 'EN_ROTACION').map(b => b.game.appid),
      completed: backlog.filter(b => b.status === 'COMPLETADO').map(b => b.game.appid),
      headers,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
