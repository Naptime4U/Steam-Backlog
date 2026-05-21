import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // TODO: Reemplazar por el userId real si hay auth
    const userId = 1;
    // Obtiene el backlog y completados del usuario
    const backlog = await prisma.backlog.findMany({
      where: { userId },
      include: { game: true },
    });
    return NextResponse.json({
      backlog: backlog.filter(b => b.status === 'EN_ROTACION').map(b => b.game.appid),
      completed: backlog.filter(b => b.status === 'COMPLETADO').map(b => b.game.appid),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
