/**
 * Minecraft UUID から現在のプレイヤー名を引く。
 *
 * moripath と同じ ashcon.app の Mojang ミラーを使う。名前が引けなかった
 * 場合は UUID の先頭 8 桁を返し、表示が空にならないようにする。
 */
export async function getPlayerName(uuid: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(uuid)}`
    );
    if (!res.ok) return uuid.slice(0, 8);
    const profile = (await res.json()) as { username?: unknown };
    return typeof profile.username === "string" && profile.username
      ? profile.username
      : uuid.slice(0, 8);
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
