/**
 * 記事の保存リクエストに画像を載せるときの取り決め。ブラウザ
 * (PostEditorClient) とサーバー (updatePost) の両方が読む。
 *
 * エディタに入れた画像は保存までブラウザのメモリ (hagaki/pending-images) に
 * AVIF の Blob として置かれ、保存時に本文と一緒に Server Action へ送られて
 * 1 コミットにまとまる。
 */

/**
 * 保存 1 回で送れる上限 (バイト)。next.config.ts の
 * `experimental.serverActions.bodySizeLimit` にもこの値を渡す。
 *
 * vinext の Server Action は既定で 1MB までしか受け付けないが、画像は 1 枚
 * 500KB まであるので 2 枚で超えてしまう。Workers のメモリ (128MB) と
 * リクエスト上限 (100MB) に十分収まる範囲で引き上げている。
 */
export const SAVE_REQUEST_LIMIT_BYTES = 8 * 1024 * 1024;

/** エラー表示用の上限の表記。 */
export const SAVE_REQUEST_LIMIT_LABEL = "8MB";

/**
 * 本文や JSON の引数、multipart の区切りなど、画像以外が占める分の見積もり。
 * ブラウザ側の事前チェックで画像の合計にこれと本文の長さを足す。
 */
export const SAVE_REQUEST_OVERHEAD_BYTES = 64 * 1024;

/** 画像を載せる FormData のフィールド名。同じ順番で 1 組ずつ append する。 */
export const IMAGE_FORM_FIELDS = {
  /** 画像 id (uuid)。ファイル名 `<id>.avif` になる。 */
  id: "imageId",
  /** AVIF の Blob。 */
  file: "image",
} as const;
