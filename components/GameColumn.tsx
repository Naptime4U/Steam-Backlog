import GameCard from './GameCard';

interface GameColumnProps {
  title: string;
  games: string[];
}

export default function GameColumn({ title, games }: GameColumnProps) {
  return (
    <section style={{border: '2px solid black', padding: 16, minWidth: 220}}>
      <h2>{title}</h2>
      {games.map((game) => (
        <GameCard key={game} name={game} />
      ))}
    </section>
  );
}
