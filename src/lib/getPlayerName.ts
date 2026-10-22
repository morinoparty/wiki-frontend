import { createTtlCache } from "./ttlCache";

// プレイヤー名の変更は稀なので、引けた名前は 1 日使い回す
const nameCache = createTtlCache<string>(24 * 60 * 60 * 1000);

/**
 * UUID からプレイヤー名を返す Mojang 公式の API。上から順に試す。
 *
 * 以前使っていた ashcon.app のミラーは Workers から叩くと 429 (rate limit) が
 * 返り続け、名前が解決できなくなったため公式 API に切り替えた。
 * どちらも `{ id, name }` を返し、UUID はハイフン無しで渡す。
 */
const PROFILE_ENDPOINTS = [
  (id: string) =>
    `https://api.minecraftservices.com/minecraft/profile/lookup/${id}`,
  (id: string) =>
    `https://sessionserver.mojang.com/session/minecraft/profile/${id}`,
];

/** 1 つのエンドポイントから名前を引く。引けなければ null。 */
async function fetchName(url: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const profile = (await res.json()) as { name?: unknown };
  return typeof profile.name === "string" && profile.name ? profile.name : null;
}

/**
 * Minecraft UUID から現在のプレイヤー名を引く。
 *
 * 名前が引けなかった場合は UUID の先頭 8 桁を返し、表示が空にならないようにする。
 */
export async function getPlayerName(uuid: string): Promise<string> {
  const cached = nameCache.get(uuid);
  if (cached) return cached;
  const id = uuid.replaceAll("-", "");
  for (const endpoint of PROFILE_ENDPOINTS) {
    try {
      const name = await fetchName(endpoint(encodeURIComponent(id)));
      if (name) {
        nameCache.set(uuid, name);
        return name;
      }
    } catch (error) {
      console.error(`Error resolving player name for ${uuid}:`, error);
    }
  }
  return uuid.slice(0, 8);
}

/** 複数の UUID をまとめて解決する。キーは UUID、値はプレイヤー名。 */
export async function getPlayerNames(
  uuids: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(uuids)];
  const names = await Promise.all(unique.map((uuid) => getPlayerName(uuid)));
  return new Map(unique.map((uuid, index) => [uuid, names[index]]));
}
