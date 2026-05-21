"use client";
import { useSteamId } from "../lib/useSteamId";
import { useSteamProfile } from "../lib/useSteamProfile";

export default function AuthButton() {
  const steamId = useSteamId();
  const profile = useSteamProfile(steamId);

  if (!steamId) {
    return (
      <button
        className="flex items-center gap-3 px-5 py-2 rounded-lg bg-[#171a21] border border-[#66c0f4] text-[#c7d5e0] font-semibold shadow hover:bg-[#23262e] hover:border-[#417a9b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#66c0f4]"
        style={{ boxShadow: '0 2px 8px 0 #0006' }}
        onClick={() => window.location.href = "/api/auth/steam"}
      >
        <img src="/steam.png" alt="Steam" className="w-6 h-6" />
        Iniciar sesión con Steam
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#23262e] border border-[#66c0f4] text-[#c7d5e0] font-semibold shadow" style={{ boxShadow: '0 2px 8px 0 #0006' }}>
      {profile?.avatar && (
        <img src={profile.avatar} alt="avatar" className="w-8 h-8 rounded-full border border-[#66c0f4]" />
      )}
      <span>{profile?.name || steamId}</span>
      <button
        className="ml-2 px-3 py-1 rounded bg-[#66c0f4] text-[#171a21] font-bold hover:bg-[#417a9b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#66c0f4]"
        onClick={() => {
          document.cookie = 'steamId=; Max-Age=0; path=/;';
          window.location.reload();
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
