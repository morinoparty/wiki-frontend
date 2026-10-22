import { createTtlCache } from "./ttlCache";

// プレイヤー名の変更は稀なので、引けた名前は 1 日使い回す
const nameCache = createTtlCache<string>(24 * 60 * 60 * 1000);

/** プロフィール API 1 つ分。URL の組み立てと、レスポンスから名前を取り出す方法を持つ。 */
interface ProfileEndpoint {
  url: (uuid: string) => string;
  pickName: (body: unknown) => unknown;
}

/**
 * UUID からプレイヤー名を返す API。上から順に試す。
 *
 * 以前使っていた ashcon.app のミラーは 429 (rate limit) を返し続ける。
 * Mojang の公式 API も Workers の共有 IP からはほぼ rate limit に当たるので、
 * キャッシュを持つ playerdb.co を先に引き、公式 API は予備にする。
 */
const PROFILE_ENDPOINTS: ProfileEndpoint[] = [
  {
    url: (uuid) => `https://playerdb.co/api/player/minecraft/${uuid}`,
    pickName: (body) =>
      (body as { data?: { player?: { username?: unknown } } }).data?.player
        ?.username,
  },
  {
    // 公式 API は UUID をハイフン無しで受け取る
    url: (uuid) =>
      `https://api.minecraftservices.com/minecraft/profile/lookup/${uuid.replaceAll("-", "")}`,
    pickName: (body) => (body as { name?: unknown }).name,
  },
  {
    url: (uuid) =>
      `https://sessionserver.mojang.com/session/minecraft/profile/${uuid.replaceAll("-", "")}`,
    pickName: (body) => (body as { name?: unknown }).name,
  },
];

/** 1 つのエンドポイントから名前を引く。引けなければ null。 */
async function fetchName(
  endpoint: ProfileEndpoint,
  uuid: string
): Promise<string | null> {
  const url = endpoint.url(encodeURIComponent(uuid));
  // playerdb は User-Agent の無いリクエストを断ることがあるので付けておく
  const res = await fetch(url, {
    headers: { "User-Agent": "wiki-frontend (+https://github.com/morinoparty/wiki-frontend)" },
  });
  if (!res.ok) {
    // rate limit などで引けなかったときに原因を追えるよう、ステータスを残す
    console.warn(`Player name lookup failed: ${res.status} ${url}`);
    return null;
  }
  const name = endpoint.pickName(await res.json());
  return typeof name === "string" && name ? name : null;
}

/**
 * Minecraft UUID から現在のプレイヤー名を引く。
 *
 * 名前が引けなかった場合は UUID の先頭 8 桁を返し、表示が空にならないようにする。
 */
export async function getPlayerName(uuid: string): Promise<string> {
  const cached = nameCache.get(uuid);
  if (cached) return cached;
  for (const endpoint of PROFILE_ENDPOINTS) {
    try {
      const name = await fetchName(endpoint, uuid);
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
