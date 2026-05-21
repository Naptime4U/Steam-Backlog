interface GameCardProps {
  name: string;
}

export default function GameCard({ name }: GameCardProps) {
  return (
    <div style={{border: '3px solid black', margin: 8, padding: 8, borderRadius: 4, background: '#fff'}}>
      {name}
    </div>
  );
}
