import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_REALM = process.env.NEXTAUTH_URL;
const STEAM_RETURN_URL = `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`;
const STEAM_API_KEY = process.env.STEAM_API_KEY;

const SteamProvider = {
  id: "steam",
  name: "Steam",
  type: "oauth", // Forzar tipo oauth para compatibilidad UI
  authorization: {
    url: STEAM_OPENID_URL,
    params: {
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.mode": "checkid_setup",
      "openid.return_to": STEAM_RETURN_URL,
      "openid.realm": STEAM_REALM,
      "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    },
  },
  style: {
    logo: "/steam.svg",
    logoDark: "/steam.svg",
    bg: "#171a21",
    text: "#c7d5e0",
    textDark: "#c7d5e0",
    bgDark: "#171a21",
  },
  options: {},
  async profile(profile: any, tokens: any) {
    // Extrae steamid del openid.claimed_id
    const claimedId = profile?.openid_claimed_id || tokens?.profile?.openid_claimed_id || "";
    const url = new URL(claimedId);
    const steamId = url.pathname.split("/").pop();
    let avatar = null;
    let personaname = null;
    if (STEAM_API_KEY && steamId) {
      const res = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
      );
      const data = await res.json();
      if (data.response.players.length > 0) {
        avatar = data.response.players[0].avatarfull;
        personaname = data.response.players[0].personaname;
      }
    }
    return {
      id: steamId,
      name: personaname,
      image: avatar,
    };
  },
};

const authOptions: NextAuthOptions = {
  providers: [SteamProvider as any],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };