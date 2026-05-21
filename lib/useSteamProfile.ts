import { useEffect, useState } from "react";

export function useSteamProfile(steamId?: string | null) {
  const [profile, setProfile] = useState<{ avatar?: string; name?: string } | null>(null);
  useEffect(() => {
    if (!steamId) return;
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/steam/profile?steamid=${steamId}`);
        if (res.ok) {
          const data = await res.json();
          setProfile({
            avatar: data.avatar,
            name: data.personaname,
          });
        }
      } catch {}
    }
    fetchProfile();
  }, [steamId]);
  return profile;
}
