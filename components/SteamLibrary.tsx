import React, { useEffect, useState } from 'react';
import { fetchLibraryWithDetails, SteamGame } from '../lib/steam';

export default function SteamLibrary() {
  const [games, setGames] = useState<SteamGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLibraryWithDetails(10)
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Error al cargar la biblioteca');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando biblioteca...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Tu biblioteca de Steam</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {games.map((game) => (
          <div key={game.appid} style={{ border: '1px solid #ccc', padding: 8, width: 200 }}>
            {game.header_image && (
              <img src={game.header_image} alt={game.name} style={{ width: '100%' }} />
            )}
            <h3>{game.name}</h3>
            <p>Tiempo jugado: {Math.round(game.playtime_forever / 60)} horas</p>
          </div>
        ))}
      </div>
    </div>
  );
}
