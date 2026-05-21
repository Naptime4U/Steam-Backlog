import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, backlog, completed, games } = body;

    // Asegura que todos los juegos existen en la tabla Game y obtiene sus IDs
    let appidToId: Record<number, number> = {};
    if (games && Array.isArray(games)) {
      const upsertedGames = await Promise.all(
        games.map(game =>
          prisma.game.upsert({
            where: { appid: game.appid },
            update: { name: game.name, headerUrl: game.header_image },
            create: { appid: game.appid, name: game.name, headerUrl: game.header_image },
          })
        )
      );
      // Mapea appid a id
      upsertedGames.forEach(g => {
        appidToId[g.appid] = g.id;
      });
    }

    // Borra el backlog anterior del usuario
    await prisma.backlog.deleteMany({ where: { userId } });
    // Inserta el nuevo backlog usando los IDs reales
    const backlogData = [
      ...backlog.map((appid: number) => ({ userId, gameId: appidToId[appid], status: 'EN_ROTACION' })),
      ...completed.map((appid: number) => ({ userId, gameId: appidToId[appid], status: 'COMPLETADO' })),
    ];
    await prisma.backlog.createMany({ data: backlogData });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
