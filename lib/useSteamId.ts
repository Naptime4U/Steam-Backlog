import { useEffect, useState } from "react";

export function useSteamId() {
  const [steamId, setSteamId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSteamId(document.cookie.split('; ').find(row => row.startsWith('steamId='))?.split('=')[1] || null);
    }
  }, []);
  return steamId;
}
