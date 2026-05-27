
import React, { useState, useRef, useEffect } from 'react';
import { fetchLibrary, SteamGame } from '../lib/steam';
import { useSteamId } from '../lib/useSteamId';

function getSteamHeaderUrl(appid: number): string {
    return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

function getIconFallback(game: SteamGame): string {
    if (game.img_logo_url) {
        return `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg`;
    }
    if (game.img_icon_url) {
        return `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`;
    }
    return '/steam.png';
}

// Cache de URLs reales obtenidas de appdetails, para no repetir la petición
const appdetailsCache = new Map<number, string | null>();

function GameImage({ game, className }: { game: SteamGame; className?: string }) {
    const [src, setSrc] = useState(() => {
        // Si ya tenemos la URL real en caché (de DB o de una petición anterior), la usamos
        const cached = appdetailsCache.get(game.appid);
        return cached || getSteamHeaderUrl(game.appid);
    });
    const [stage, setStage] = useState<'header' | 'fetching' | 'icon' | 'done'>('header');

    const handleError = async () => {
        if (stage === 'header') {
            setStage('fetching');
            // Usar caché solo si la URL cacheada es DISTINTA a la que acaba de fallar
            // (evita bucle cuando DB guardó una URL mala como header.jpg que no existe)
            const cached = appdetailsCache.get(game.appid);
            if (cached && cached !== src) {
                setSrc(cached);
                setStage('icon');
                return;
            }
            // Pedir la URL real a Steam Store (sobreescribe cualquier valor malo en caché)
            try {
                const res = await fetch(`/api/steam/appdetails?appid=${game.appid}`);
                if (res.ok) {
                    const data = await res.json();
                    const realUrl: string | null = data?.headers?.[game.appid] || null;
                    appdetailsCache.set(game.appid, realUrl);
                    if (realUrl && realUrl !== src) {
                        setSrc(realUrl);
                        setStage('icon');
                        return;
                    }
                }
            } catch { /* silencio */ }
            // appdetails no tiene imagen → icono
            setSrc(getIconFallback(game));
            setStage('done');
        } else if (stage === 'icon') {
            setSrc(getIconFallback(game));
            setStage('done');
        } else {
            setSrc('/steam.png');
            setStage('done');
        }
    };

    return (
        <img
            src={src}
            alt={game.name}
            className={className}
            onError={stage === 'done' ? undefined : handleError}
        />
    );
}

function getColumnNameById(id: string): string {
    if (id === 'backlog') return 'Backlog';
    if (id === 'completed') return 'Completados';
    return '';
}

export default function ManualDragDropBacklog() {
    const steamId = useSteamId();
    const [libraryGames, setLibraryGames] = useState<SteamGame[]>([]);
    // Ref para la lista de biblioteca
    const libraryListRef = useRef<HTMLDivElement | null>(null);
    // Estado para columnas (backlog y completados, usando appid)
    const [columns, setColumns] = useState<{ backlog: number[]; completed: number[] }>({
        backlog: [],
        completed: [],
    });
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<null | boolean>(null);
    const [dragged, setDragged] = useState<{ appid: number; from: keyof typeof columns | 'library' } | null>(null);
    const [draggedPos, setDraggedPos] = useState<{ x: number; y: number } | null>(null);
    const dragItemRef = useRef<HTMLDivElement | null>(null);
    const scrollSpeedRef = useRef(0);
    const scrollFrameRef = useRef<number | null>(null);

    // Cargar toda la biblioteca de Steam y el backlog guardado al montar
    useEffect(() => {
        async function loadData() {
            if (!steamId) return;
            const [games, backlogRes] = await Promise.all([
                fetchLibrary(steamId),
                fetch('/api/backlog/get').then(r => r.ok ? r.json() : { backlog: [], completed: [] })
            ]);
            // Pre-cargar headers de la DB en la caché para evitar peticiones innecesarias
            if (backlogRes.headers && typeof backlogRes.headers === 'object') {
                for (const [key, value] of Object.entries(backlogRes.headers)) {
                    const appid = Number(key);
                    if (appid > 0 && typeof value === 'string' && value.length > 0) {
                        appdetailsCache.set(appid, value as string);
                    }
                }
            }
            setLibraryGames(games);
            setColumns({
                backlog: backlogRes.backlog || [],
                completed: backlogRes.completed || [],
            });
            setLoading(false);
        }
        loadData();
    }, [steamId]);

    // Disable text selection durante drag
    React.useEffect(() => {
        if (dragged) {
            const prev = document.body.style.userSelect;
            document.body.style.userSelect = 'none';
            return () => {
                document.body.style.userSelect = prev;
            };
        }
    }, [dragged]);

    // Mouse/touch move handler + auto-scroll near viewport edges
    React.useEffect(() => {
        const EDGE = 80; // px from top/bottom edge that triggers scroll
        const MAX_SPEED = 12; // max px per frame

        function onMove(e: MouseEvent | TouchEvent) {
            if ('touches' in e) {
                e.preventDefault(); // prevent page scroll during drag
                const x = e.touches[0].clientX;
                const y = e.touches[0].clientY;
                setDraggedPos({ x, y });
                // Set scroll speed based on proximity to viewport edge
                const vh = window.innerHeight;
                if (y < EDGE) {
                    scrollSpeedRef.current = -MAX_SPEED * (1 - y / EDGE);
                } else if (y > vh - EDGE) {
                    scrollSpeedRef.current = MAX_SPEED * (1 - (vh - y) / EDGE);
                } else {
                    scrollSpeedRef.current = 0;
                }
            } else {
                setDraggedPos({ x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY });
            }
        }

        function scrollLoop() {
            if (scrollSpeedRef.current !== 0) {
                window.scrollBy(0, scrollSpeedRef.current);
            }
            scrollFrameRef.current = requestAnimationFrame(scrollLoop);
        }

        if (dragged) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('touchmove', onMove, { passive: false });
            scrollFrameRef.current = requestAnimationFrame(scrollLoop);
        } else {
            setDraggedPos(null);
            scrollSpeedRef.current = 0;
        }
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
            if (scrollFrameRef.current !== null) {
                cancelAnimationFrame(scrollFrameRef.current);
                scrollFrameRef.current = null;
            }
            scrollSpeedRef.current = 0;
        };
    }, [dragged]);

    // Mouse/touch up handler
    React.useEffect(() => {
        function onUp(e: MouseEvent | TouchEvent) {
            if (!dragged) return;
            let target = document.elementFromPoint(
                'touches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX,
                'touches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY
            );
            while (target && target instanceof HTMLElement && !target.dataset.column) {
                target = target.parentElement;
            }
            if (target && target instanceof HTMLElement && target.dataset.column) {
                const to = target.dataset.column as keyof typeof columns | 'library';
                if (to !== dragged.from) {
                    setColumns((prev) => {
                        if (to === 'library') {
                            // Eliminar de backlog y completados, pero no añadir a biblioteca
                            const newBacklog = prev.backlog.filter((g) => g !== dragged.appid);
                            const newCompleted = prev.completed.filter((g) => g !== dragged.appid);
                            return {
                                ...prev,
                                backlog: newBacklog,
                                completed: newCompleted,
                            };
                        } else {
                            // Añadir a destino, nunca eliminar de biblioteca
                            const fromList = dragged.from === 'library' ? prev[to] : prev[dragged.from].filter((g) => g !== dragged.appid);
                            const toList = prev[to].includes(dragged.appid)
                                ? prev[to]
                                : [...prev[to], dragged.appid];
                            return {
                                ...prev,
                                ...(dragged.from !== 'library' && { [dragged.from]: fromList }),
                                [to]: toList,
                            };
                        }
                    });
                }
            }
            setDragged(null);
        }
        if (dragged) {
            window.addEventListener('mouseup', onUp);
            window.addEventListener('touchend', onUp);
        }
        return () => {
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchend', onUp);
        };
    }, [dragged, columns]);

    function handleDragStart(appid: number, from: keyof typeof columns | 'library') {
        if (!editMode) return;
        setDragged({ appid, from });
    }

    // Calcular juegos que están en backlog o completados
    const gamesInOtherColumns = new Set([
        ...columns.backlog,
        ...columns.completed,
    ]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh] w-full">
            <div className="flex flex-col items-center gap-4 bg-[#1b2838] border border-[#23262e] rounded-xl px-8 py-10 shadow-lg animate-fade-in">
                <svg className="animate-spin h-10 w-10 text-[#66c0f4] mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#66c0f4" strokeWidth="4" />
                    <path className="opacity-75" fill="#66c0f4" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-[#c7d5e0] text-lg font-semibold tracking-wide drop-shadow">Cargando tu biblioteca de Steam...</span>
                <span className="text-[#66c0f4] text-sm opacity-80">Por favor, espera unos segundos</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex gap-4 mb-2">
                {!editMode && (
                    <button
                        className="px-6 py-2 rounded border border-[#66c0f4] bg-[#171a21] text-[#66c0f4] font-semibold shadow hover:bg-[#1b2838] hover:text-white transition-colors"
                        onClick={() => setEditMode(true)}
                    >
                        Editar
                    </button>
                )}
                {editMode && (
                    <button
                        className="px-6 py-2 rounded border border-[#66c0f4] bg-[#66c0f4] text-[#171a21] font-bold shadow hover:bg-[#417a9b] hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={saving}
                        onClick={async () => {
                            setSaving(true);
                            setSaveSuccess(null);
                            if (!steamId) return;
                            try {
                                const res = await fetch('/api/backlog/save', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        userSteamId: steamId,
                                        backlog: columns.backlog,
                                        completed: columns.completed,
                                        games: libraryGames.map((game) => ({
                                            ...game,
                                            // Usar la URL real resuelta si está en caché, si no el header.jpg estándar
                                            header_image: appdetailsCache.get(game.appid) || getSteamHeaderUrl(game.appid),
                                        })),
                                    })
                                });
                                if (res.ok) {
                                    setSaveSuccess(true);
                                    setEditMode(false);
                                } else {
                                    setSaveSuccess(false);
                                }
                            } catch {
                                setSaveSuccess(false);
                            } finally {
                                setSaving(false);
                                setTimeout(() => setSaveSuccess(null), 2000);
                            }
                        }}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                )}
                {/* Eliminada confirmación verde de guardado exitoso */}
                {saveSuccess === false && (
                    <span className="ml-4 text-red-400 font-semibold">Error al guardar</span>
                )}
            </div>
            <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[500px]">
                {/* Biblioteca */}
                <section
                    key="library"
                    data-column="library"
                    ref={libraryListRef}
                    className="w-full lg:flex-1 lg:min-w-[300px] lg:max-w-xl bg-[#1b2838] rounded-xl border border-[#23262e] shadow p-4 sm:p-6 flex flex-col gap-2"
                >
                    <h2 className="text-lg font-extrabold mb-2 text-[#66c0f4] drop-shadow">Biblioteca</h2>
                    <div className="flex flex-col gap-3">
                        {libraryGames.map((game) => {
                            const isDisabled = gamesInOtherColumns.has(game.appid);
                            return (
                                <div
                                    key={game.appid}
                                    data-appid={game.appid}
                                    className={`flex items-center gap-4 rounded-lg border border-[#23262e] bg-[#101822] px-4 py-3 shadow-sm transition-all select-none ${isDisabled ? 'opacity-50 pointer-events-none' : editMode ? 'cursor-grab hover:shadow-lg hover:border-[#66c0f4]' : 'cursor-not-allowed'}`}
                                    style={{ opacity: isDisabled ? 0.5 : (dragged && dragged.appid === game.appid && dragged.from === 'library' ? 0.5 : 1), minHeight: 80, touchAction: (editMode && !isDisabled) ? 'none' : 'auto' }}
                                    onMouseDown={isDisabled || !editMode ? undefined : () => handleDragStart(game.appid, 'library')}
                                    onTouchStart={isDisabled || !editMode ? undefined : () => handleDragStart(game.appid, 'library')}
                                    aria-disabled={isDisabled || !editMode}
                                >
                                    <div className="flex items-center justify-center bg-[#23262e] border border-[#66c0f4] rounded w-32 h-14 overflow-hidden mr-2 shadow min-w-[128px] max-w-[128px] min-h-[56px] max-h-[56px]">
                                        <GameImage game={game} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-semibold text-base text-[#c7d5e0] break-words whitespace-normal leading-snug max-w-[220px] line-clamp-2">
                                        {game.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Backlog y Completados */}
                {(['backlog', 'completed'] as const).map((col) => (
                    <section
                        key={col}
                        data-column={col}
                        className="w-full lg:flex-1 lg:min-w-[300px] lg:max-w-xl bg-[#1b2838] rounded-xl border border-[#23262e] shadow p-4 sm:p-6 flex flex-col gap-2"
                    >
                        <h2 className="text-lg font-extrabold mb-2 text-[#66c0f4] drop-shadow">{getColumnNameById(col)}</h2>
                        <div className="flex flex-col gap-3">
                            {columns[col].map((appid) => {
                                const game = libraryGames.find((g) => g.appid === appid);
                                if (!game) return null;
                                return (
                                    <div
                                        key={appid}
                                        className={`flex items-center gap-4 rounded-lg border border-[#23262e] bg-[#101822] px-4 py-3 shadow-sm transition-all select-none ${editMode ? 'cursor-grab hover:shadow-lg hover:border-[#66c0f4]' : 'cursor-not-allowed'}`}
                                        style={{ opacity: dragged && dragged.appid === appid && dragged.from === col ? 0.5 : 1, minHeight: 80, touchAction: editMode ? 'none' : 'auto' }}
                                        onMouseDown={editMode ? () => handleDragStart(appid, col) : undefined}
                                        onTouchStart={editMode ? () => handleDragStart(appid, col) : undefined}
                                        aria-disabled={!editMode}
                                    >
                                        <div className="flex items-center justify-center bg-[#23262e] border border-[#66c0f4] rounded w-32 h-14 overflow-hidden mr-2 shadow min-w-[128px] max-w-[128px] min-h-[56px] max-h-[56px]">
                                            <GameImage game={game} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-semibold text-base text-[#c7d5e0] break-words whitespace-normal leading-snug max-w-[220px] line-clamp-2">
                                            {game.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}

                {/* Dragged card visual */}
                {dragged && draggedPos && (() => {
                    const game = libraryGames.find((g) => g.appid === dragged.appid);
                    if (!game) return null;
                    return (
                        <div
                            ref={dragItemRef}
                            className="fixed pointer-events-none z-50 border-2 border-[#66c0f4] bg-[#23262e] px-3 py-2 rounded-lg shadow-lg flex items-center gap-4 font-bold"
                            style={{
                                left: draggedPos.x + 8,
                                top: draggedPos.y + 8,
                                minHeight: 56
                            }}
                        >
                            <div className="flex items-center justify-center bg-[#23262e] border border-[#66c0f4] rounded w-32 h-14 overflow-hidden mr-2 shadow min-w-[128px] max-w-[128px] min-h-[56px] max-h-[56px]">
                                <GameImage game={game} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-semibold text-base text-[#c7d5e0] break-words whitespace-normal leading-snug max-w-[220px] line-clamp-2">
                                {game.name}
                            </span>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
