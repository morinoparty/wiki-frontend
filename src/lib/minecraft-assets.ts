/**
 * Minecraft のモデル/テクスチャ/アイテム定義の配信元 (Worker `mc-assets` の workers.dev URL)。
 * 最新リリースの client.jar の `assets/minecraft/` と同じ構成で、
 * chlorophyll の `MinecraftProvider` の `assets` にそのまま渡す。
 * ブラウザから直接読むので、env ではなくビルドに埋め込む定数にしている (CONTENT_BASE_URL と同じ)。
 *
 * 特定のバージョンに固定したい場合は `https://v26-3-mc-assets.morinoparty.workers.dev/assets/minecraft`
 * のような Version URL の alias を使う (https://github.com/morinoparty/mc-assets)。
 */
export const MINECRAFT_ASSETS_URL =
  "https://mc-assets.morinoparty.workers.dev/assets/minecraft";
