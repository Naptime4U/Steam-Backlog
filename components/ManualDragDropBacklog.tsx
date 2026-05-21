
import React, { useState, useRef, useEffect } from 'react';
import { fetchLibrary, fetchGameDetails, SteamGame } from '../lib/steam';

import { useSteamId } from '../lib/useSteamId';



function getColumnNameById(id: string) {
    if (id === 'library') return 'Biblioteca';
    if (id === 'backlog') return 'Backlog/En rotación';
    if (id === 'completed') return 'Completados';
    return '';
}
export default function ManualDragDropBacklog() {
    const steamId = useSteamId();
    // Estado para juegos de Steam (sin imágenes al principio)
    const [libraryGames, setLibraryGames] = useState<SteamGame[]>([]);
    // Estado para imágenes cargadas
    const [gameImages, setGameImages] = useState<Record<number, string>>({});
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

    // Cargar toda la biblioteca de Steam y el backlog guardado al montar
    useEffect(() => {
        async function loadData() {
            if (!steamId) return;
            const [games, backlogRes] = await Promise.all([
                fetchLibrary(steamId),
                fetch('/api/backlog/get').then(r => r.ok ? r.json() : { backlog: [], completed: [] })
            ]);
            setLibraryGames(games);
            setColumns({
                backlog: backlogRes.backlog || [],
                completed: backlogRes.completed || [],
            });
            setLoading(false);
        }
        loadData();
    }, [steamId]);

    // Lazy load de imágenes mejorado: también carga headers de juegos en backlog y completados
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        let cancelled = false;
        async function loadImages() {
            // 1. Cargar headers de juegos en backlog y completados aunque no estén en la biblioteca visible
            const allNeededAppids = Array.from(new Set([
                ...columns.backlog,
                ...columns.completed
            ]));
            const missingBacklogHeaders = allNeededAppids.filter(appid => !gameImages[appid]);
            if (missingBacklogHeaders.length > 0) {
                await Promise.all(missingBacklogHeaders.map(async (appid) => {
                    const details = await fetchGameDetails(appid);
                    if (details && details.header_image && !cancelled) {
                        setGameImages(prev => ({ ...prev, [appid]: details.header_image }));
                    }
                }));
            }
            // 2. Lazy load para la biblioteca visible
            if (libraryListRef.current) {
                const cards = Array.from(libraryListRef.current.querySelectorAll('[data-appid]'));
                const toLoad: number[] = [];
                cards.forEach((el) => {
                    const rect = el.getBoundingClientRect();
                    if (rect.bottom > 0 && rect.top < window.innerHeight) {
                        const appid = Number(el.getAttribute('data-appid'));
                        if (appid && !gameImages[appid]) {
                            toLoad.push(appid);
                        }
                    }
                });
                if (toLoad.length > 0) {
                    await Promise.all(toLoad.map(async (appid) => {
                        const details = await fetchGameDetails(appid);
                        if (details && details.header_image && !cancelled) {
                            setGameImages(prev => ({ ...prev, [appid]: details.header_image }));
                        }
                    }));
                }
            }
        }
        loadImages();
        interval = setInterval(() => {
            loadImages();
        }, 800);
        window.addEventListener('scroll', loadImages);
        window.addEventListener('resize', loadImages);
        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
            window.removeEventListener('scroll', loadImages);
            window.removeEventListener('resize', loadImages);
        };
    }, [libraryGames, columns, gameImages]);

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

    // Mouse/touch move handler
    React.useEffect(() => {
        function onMove(e: MouseEvent | TouchEvent) {
            let x = 0, y = 0;
            if ('touches' in e) {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            } else {
                x = e.clientX;
                y = e.clientY;
            }
            setDraggedPos({ x, y });
        }
        if (dragged) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('touchmove', onMove);
        } else {
            setDraggedPos(null);
        }
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
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
                            // TODO: Reemplazar por el userId real si hay auth
                            const userId = 1;
                            try {
                                const res = await fetch('/api/backlog/save', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        userId,
                                        backlog: columns.backlog,
                                        completed: columns.completed,
                                        games: libraryGames,
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
            <div className="flex gap-8 w-full min-h-[500px] justify-between">
                {/* Biblioteca */}
                <section
                    key="library"
                    data-column="library"
                    ref={libraryListRef}
                    className="flex-1 min-w-[340px] max-w-xl bg-[#1b2838] rounded-xl border border-[#23262e] shadow p-6 flex flex-col gap-2 ml-0"
                    style={{ marginLeft: 0 }}
                >
                    <h2 className="text-lg font-extrabold mb-2 text-[#66c0f4] drop-shadow">Biblioteca</h2>
                    <div className="flex flex-col gap-3">
                        {libraryGames.map((game, idx) => {
                            const isDisabled = gamesInOtherColumns.has(game.appid);
                            const headerImage = gameImages[game.appid];
                            return (
                                <div
                                    key={game.appid}
                                    data-appid={game.appid}
                                    className={`flex items-center gap-4 rounded-lg border border-[#23262e] bg-[#101822] px-4 py-3 shadow-sm transition-all select-none ${isDisabled ? 'opacity-50 pointer-events-none' : editMode ? 'cursor-grab hover:shadow-lg hover:border-[#66c0f4]' : 'cursor-not-allowed'}`}
                                    style={{ opacity: isDisabled ? 0.5 : (dragged && dragged.appid === game.appid && dragged.from === 'library' ? 0.5 : 1), minHeight: 80 }}
                                    onMouseDown={isDisabled || !editMode ? undefined : () => handleDragStart(game.appid, 'library')}
                                    onTouchStart={isDisabled || !editMode ? undefined : () => handleDragStart(game.appid, 'library')}
                                    aria-disabled={isDisabled || !editMode}
                                >
                                    {headerImage && (
                                        <div className="flex items-center justify-center bg-[#23262e] border border-[#66c0f4] rounded w-32 h-14 overflow-hidden mr-2 shadow min-w-[128px] max-w-[128px] min-h-[56px] max-h-[56px]">
                                            <img src={headerImage} alt={game.name} className="w-full h-full object-cover" />
                                        </div>
                                    )}
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
                        className="flex-1 min-w-[340px] max-w-xl bg-[#1b2838] rounded-xl border border-[#23262e] shadow p-6 flex flex-col gap-2"
                    >
                        <h2 className="text-lg font-extrabold mb-2 text-[#66c0f4] drop-shadow">{getColumnNameById(col)}</h2>
                        <div className="flex flex-col gap-3">
                            {columns[col].map((appid) => {
                                const game = libraryGames.find((g) => g.appid === appid);
                                if (!game) return null;
                                const headerImage = gameImages[appid];
                                return (
                                    <div
                                        key={appid}
                                        className={`flex items-center gap-4 rounded-lg border border-[#23262e] bg-[#101822] px-4 py-3 shadow-sm transition-all select-none ${editMode ? 'cursor-grab hover:shadow-lg hover:border-[#66c0f4]' : 'cursor-not-allowed'}`}
                                        style={{ opacity: dragged && dragged.appid === appid && dragged.from === col ? 0.5 : 1, minHeight: 80 }}
                                        onMouseDown={editMode ? () => handleDragStart(appid, col) : undefined}
                                        onTouchStart={editMode ? () => handleDragStart(appid, col) : undefined}
                                        aria-disabled={!editMode}
                                    >
                                        {headerImage && (
                                            <div className="flex items-center justify-center bg-[#23262e] border border-[#66c0f4] rounded w-32 h-14 overflow-hidden mr-2 shadow min-w-[128px] max-w-[128px] min-h-[56px] max-h-[56px]">
                                                <img src={headerImage} alt={game.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
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
                    const headerImage = gameImages[dragged.appid];
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
                            {headerImage && (
                                <div className="flex items-center justify-center bg-[#23262e] border border-[#66c0f4] rounded w-32 h-14 overflow-hidden mr-2 shadow min-w-[128px] max-w-[128px] min-h-[56px] max-h-[56px]">
                                    <img src={headerImage} alt={game.name} className="w-full h-full object-cover" />
                                </div>
                            )}
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