"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

interface SteamProfile {
  personaname: string;
  avatarfull: string;
}

export default function AuthButton({ large = false }: { large?: boolean }) {
  const [steamId, setSteamId] = useState<string | null>(null);
  const [profile, setProfile] = useState<SteamProfile | null>(null);
  const [hovering, setHovering] = useState(false);

  const pad = large ? '20px 36px' : '0 14px';
  const h = large ? 'auto' : 38;
  const fs = large ? 18 : 14;
  useEffect(() => {
    if (typeof window !== "undefined") {
      const value = document.cookie
        .split('; ')
        .find(row => row.startsWith('steamId='))
        ?.split('=')[1] || null;
      setSteamId(value);
    }
  }, []);

  useEffect(() => {
    if (!steamId) return;
    fetch(`/api/steam/profile?steamId=${steamId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.personaname) setProfile(data); });
  }, [steamId]);

  if (steamId) {
    return (
      <button
        onClick={() => { window.location.href = "/api/auth/logout"; }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: large ? 1 : undefined,
          minWidth: large ? 0 : 160,
          height: large ? 'auto' : 38,
          borderRadius: 4,
          border: hovering ? '1px solid #c0392b' : '1px solid #3d5467',
          background: hovering ? '#c0392b' : '#1b2838',
          cursor: 'pointer',
          padding: large ? '20px 36px' : '0 14px',
          transition: 'background 0.25s ease, border-color 0.25s ease',
          fontFamily: 'Arial, sans-serif',
          fontSize: fs,
          boxShadow: large ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* Normal state: avatar + name */}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            position: 'absolute',
            opacity: hovering ? 0 : 1,
            transform: hovering ? 'translateY(-6px)' : 'translateY(0)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            color: '#c7d5e0',
            whiteSpace: 'nowrap',
          }}
        >
          {profile?.avatarfull ? (
            <Image
              src={profile.avatarfull}
              alt="avatar"
              width={26}
              height={26}
              style={{ borderRadius: '50%', border: '1px solid #3d5467', flexShrink: 0 }}
              unoptimized
            />
          ) : (
            <Image src="/steam.png" alt="Steam" width={22} height={22} unoptimized style={{ flexShrink: 0 }} />
          )}
          <span style={{ fontWeight: large ? 700 : 500 }}>{profile?.personaname ?? steamId}</span>
        </span>
        {/* Hover state: cerrar sesión */}
        <span
          style={{
            position: 'absolute',
            opacity: hovering ? 1 : 0,
            transform: hovering ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            color: '#ffffff',
            fontWeight: 700,
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
          }}
        >
          Cerrar sesión
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => { window.location.href = "/api/auth/steam"; }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'linear-gradient(to bottom, #2a6496 0%, #1a4a72 100%)',
        border: '1px solid #1a4a72',
        borderRadius: 4,
        padding: large ? '20px 36px' : '8px 16px',
        cursor: 'pointer',
        color: '#c7d5e0',
        fontFamily: 'Arial, sans-serif',
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: '0.3px',
        boxShadow: large ? '0 2px 8px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.6)',
      }}
    >
      <Image src="/steam.png" alt="Steam" width={22} height={22} unoptimized />
      <span>Iniciar sesión con Steam</span>
    </button>
  );
}
