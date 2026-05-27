
import Link from "next/link";
import Image from "next/image";
import AuthButton from "../components/AuthButton";

function IconLibrary() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#66c0f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#66c0f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1" fill="#66c0f4" />
      <circle cx="4" cy="12" r="1" fill="#66c0f4" />
      <circle cx="4" cy="18" r="1" fill="#66c0f4" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#66c0f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* Hero */}
      <div
        className="w-full flex flex-col items-center justify-center py-16 px-6 gap-5 text-center"
        style={{
          background: 'linear-gradient(180deg, #1e2d3d 0%, #171a21 100%)',
          borderBottom: '1px solid #1e3448',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/steam.png" alt="Steam" width={36} height={36} unoptimized />
          <span style={{ color: '#8ba0b0', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Steam Backlog
          </span>
        </div>
        <h1 style={{ color: '#c7d5e0', fontSize: 'clamp(1.7rem, 5vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.15 }}>
          Tu backlog de Steam,<br />por fin bajo control.
        </h1>
        <p style={{ color: '#8ba0b0', maxWidth: 540, fontSize: '1.05rem', lineHeight: 1.75, margin: 0 }}>
          Conecta tu cuenta, importa toda tu biblioteca de Steam y decide qué jugar a continuación.
          Organiza tus juegos pendientes y lleva un registro de cada título que ya has completado.
        </p>
        <p style={{ color: '#4a6478', maxWidth: 460, fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
          Gratuito, sin anuncios y sin afiliación con Valve. Solo tú y tus juegos.
        </p>

        {/* Primary actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full" style={{ maxWidth: 540 }}>
          <AuthButton large />
          <Link
            href="/backlog"
            className="flex items-center justify-center"
            style={{
              padding: '20px 36px',
              borderRadius: 4,
              border: '1px solid #3d5467',
              background: '#1b2838',
              color: '#66c0f4',
              textDecoration: 'none',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '0.3px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            Ver Backlog
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '100%', height: 1, background: '#1e3448' }} />

      {/* Features */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3"
        style={{ background: '#171a21' }}
      >
        {([
          {
            Icon: IconLibrary,
            title: 'Biblioteca completa',
            desc: 'Importa automáticamente todos los juegos de tu cuenta de Steam. Toda tu colección en un solo lugar, siempre actualizada.',
          },
          {
            Icon: IconList,
            title: 'Backlog personalizado',
            desc: 'Arrastra y organiza los juegos que tienes pendientes de jugar. Prioriza lo que más te apetece y no pierdas ningún título.',
          },
          {
            Icon: IconCheck,
            title: 'Registro de completados',
            desc: 'Lleva un historial de todos los juegos que ya has terminado. Mira con orgullo todo lo que has conseguido.',
          },
        ] as const).map(({ Icon, title, desc }, i) => (
          <div
            key={title}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 14,
              padding: '48px 40px',
              borderBottom: '1px solid #1e3448',
            }}
            className={i < 2 ? 'sm:border-r sm:border-[#1e3448]' : ''}
          >
            <div style={{ padding: 14, borderRadius: 8, background: '#1b2838', border: '1px solid #1e3448' }}>
              <Icon />
            </div>
            <h2 style={{ color: '#c7d5e0', fontSize: '1rem', fontWeight: 700, margin: 0 }}>{title}</h2>
            <p style={{ color: '#8ba0b0', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Footer strip */}
      <div style={{ borderTop: '1px solid #1e3448', background: '#0f1923', padding: '20px 40px', display: 'flex', justifyContent: 'center' }}>
        <p style={{ color: '#4a6478', fontSize: '0.8rem', margin: 0 }}>
          Steam Backlog &mdash; No afiliado con Valve Corporation
        </p>
      </div>
    </div>
  );
}
