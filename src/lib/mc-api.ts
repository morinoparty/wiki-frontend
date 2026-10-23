/**
 * プレイヤーのプロフィール・アバター・スキンの配信元 (Worker `mc-api` の workers.dev URL)。
 * morinoparty に参加したことのあるプレイヤーだけを返し、それ以外は 404 になる
 * (https://github.com/morinoparty/mc-api)。
 * ブラウザから直接読むので、env ではなくビルドに埋め込む定数にしている (MINECRAFT_ASSETS_URL と同じ)。
 */
export const MC_API_URL = "https://mc-api.morinoparty.workers.dev";

/**
 * mc-api が描画するアバターの大きさ。これ以外の値は mc-api 側で大きい方に切り上げられる。
 */
const AVATAR_SIZES = [32, 64, 128] as const;

/**
 * 表示したい大きさ (CSS px) から、mc-api に要求する画像の大きさを選ぶ。
 * 高解像度の画面でもぼやけないよう 2 倍の大きさを求め、収まる最小のサイズを返す。
 */
function avatarRequestSize(pixelSize: number): number {
  const wanted = pixelSize * 2;
  return AVATAR_SIZES.find((size) => size >= wanted) ?? AVATAR_SIZES[AVATAR_SIZES.length - 1];
}

/** プレイヤーの顔 (帽子レイヤー込み) の画像 URL。chlorophyll の `PlayerAvatar` が使う。 */
export function playerAvatarUrl(playerId: string, pixelSize: number): string {
  const size = avatarRequestSize(pixelSize);
  return `${MC_API_URL}/v1/players/${encodeURIComponent(playerId)}/avatar?size=${size}`;
}

/** プレイヤーのスキン画像 URL。chlorophyll の `SkinViewer` が使う (WebGL で読むので mc-api の CORS が必要)。 */
export function playerSkinUrl(playerId: string): string {
  return `${MC_API_URL}/v1/players/${encodeURIComponent(playerId)}/skin`;
}
