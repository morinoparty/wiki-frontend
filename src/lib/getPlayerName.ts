import { createTtlCache } from "./ttlCache";

// プレイヤー名の変更は稀なので、引けた名前は 1 日使い回す
const nameCache = createTtlCache<string>(24 * 60 * 60 * 1000);

/**
 * Minecraft UUID から現在のプレイヤー名を引く。
 *
 * moripath と同じ ashcon.app の Mojang ミラーを使う。名前が引けなかった
 * 場合は UUID の先頭 8 桁を返し、表示が空にならないようにする。
 */
export async function getPlayerName(uuid: string): Promise<string> {
  const cached = nameCache.get(uuid);
  if (cached) return cached;
  try {
    const res = await fetch(
      `https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(uuid)}`
    );
    if (!res.ok) return uuid.slice(0, 8);
    const profile = (await res.json()) as { username?: unknown };
    if (typeof profile.username !== "string" || !profile.username) {
      return uuid.slice(0, 8);
    }
    nameCache.set(uuid, profile.username);
    return profile.username;
  } catch (error) {
    console.error(`Error resolving player name for ${uuid}:`, error);
    return uuid.slice(0, 8);
  }
}

/** 複数の UUID をまとめて解決する。キーは UUID、値はプレイヤー名。 */
export async function getPlayerNames(
  uuids: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(uuids)];
  const names = await Promise.all(unique.map((uuid) => getPlayerName(uuid)));
  return new Map(unique.map((uuid, index) => [uuid, names[index]]));
}
