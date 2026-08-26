import { validateAvifUpload } from "hagaki/image";
import { WIKI_REPO } from "@/lib/hagaki";

/**
 * 記事の保存時に、編集中 R2 に置かれた画像を記事本文と同じコミットへ移す。
 *
 * 画像はエディタが `/api/pending-images/<postUuid>/<imageId>` に PUT した
 * もので、R2 では `pending/<postUuid>/<imageId>.avif` に入っている。
 * コミットが成功してから pending 側を消す (失敗しても `pending/` の
 * ライフサイクルルールが回収する)。
 */

/** 画像 id は R2 のキーとファイル名を兼ねるので uuid のみ許す。 */
const UUID_REGEX = /^[a-f0-9-]{36}$/i;

export class PendingImageError extends Error {}

/**
 * R2 バインディングを取り出す。
 *
 * `cloudflare:workers` の specifier を静的に書くと Next の webpack /
 * Turbopack が解決しようとして `pnpm build` が落ちるため、`src/lib/secrets.ts`
 * と同じく変数 + ignore コメントで実行時まで残す。workerd 外 (Node) では
 * import 自体が throw するので、その旨のエラーにして呼び出し側へ返す。
 */
export async function getPendingImagesBucket(): Promise<R2Bucket> {
  const specifier = "cloudflare:workers";
  let env: { PENDING_IMAGES?: R2Bucket } | undefined;
  try {
    ({ env } = (await import(
      /* webpackIgnore: true */ /* @vite-ignore */ specifier
    )) as { env: { PENDING_IMAGES?: R2Bucket } });
  } catch {
    throw new PendingImageError(
      "画像の一時置き場を利用できません (Workers 環境でのみ動作します)"
    );
  }
  if (!env?.PENDING_IMAGES) {
    throw new PendingImageError(
      "画像の一時置き場 (PENDING_IMAGES) がバインドされていません"
    );
  }
  return env.PENDING_IMAGES;
}

function assetsPrefix(postUuid: string): string {
  return `${WIKI_REPO.contentPath}/${postUuid}/assets/`;
}

/**
 * 記事は自分のディレクトリしか触れない。追加・削除するパスは必ず
 * `content/article/<uuid>/assets/` の下でなければならない。クライアントが
 * 送ってきたパスを信用しない。
 */
export function assertOwnedAssetPath(path: string, postUuid: string): void {
  const prefix = assetsPrefix(postUuid);
  if (!path.startsWith(prefix) || path.includes("..") || path.endsWith("/")) {
    throw new PendingImageError(
      `記事の assets 外のパスは操作できません: ${path}`
    );
  }
}

export interface PendingImageFile {
  path: string;
  content: Uint8Array;
}

export interface CollectedPendingImages {
  files: PendingImageFile[];
  /** コミット成功後に消す R2 のキー。 */
  keys: string[];
}

/**
 * pending の画像 id を R2 から回収し、コミットに載せられる形で返す。
 * 見つからないものはエラー — 保存を通してしまうと本文が死んだ画像 id を
 * 参照したままコミットされる。
 */
export async function collectPendingImages(
  postUuid: string,
  imageIds: string[]
): Promise<CollectedPendingImages> {
  if (!UUID_REGEX.test(postUuid)) {
    throw new PendingImageError(`記事の uuid が不正です: ${postUuid}`);
  }

  const files: PendingImageFile[] = [];
  const keys: string[] = [];
  if (imageIds.length === 0) return { files, keys };

  const bucket = await getPendingImagesBucket();
  for (const id of imageIds) {
    if (!UUID_REGEX.test(id)) {
      throw new PendingImageError(`画像 ID が不正です: ${id}`);
    }
    const key = `pending/${postUuid}/${id}.avif`;
    const object = await bucket.get(key);
    if (!object) {
      throw new PendingImageError(
        "画像データが見つかりません。画像を挿入し直してから保存してください"
      );
    }
    const content = new Uint8Array(await object.arrayBuffer());
    // 一時置き場に入る時点でも検査しているが、コミットに載せる前にもう一度。
    validateAvifUpload(content);

    const path = `${assetsPrefix(postUuid)}${id}.avif`;
    assertOwnedAssetPath(path, postUuid);
    files.push({ path, content });
    keys.push(key);
  }
  return { files, keys };
}

/**
 * コミット済みの pending オブジェクトを片付ける。失敗しても致命的ではない
 * (ライフサイクルルールが回収する) ので、投げずに警告だけ出す。
 */
export async function deletePendingImages(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    const bucket = await getPendingImagesBucket();
    await bucket.delete(keys);
  } catch (error) {
    console.warn("pending 画像の削除に失敗しました", error);
  }
}

/** コミットメッセージに画像の増減を書き添える。 */
export function postCommitMessage(
  slug: string,
  added: number,
  removed: number
): string {
  const segments: string[] = [];
  if (added > 0) segments.push(`+${added} image${added === 1 ? "" : "s"}`);
  if (removed > 0) segments.push(`-${removed} image${removed === 1 ? "" : "s"}`);
  const suffix = segments.length > 0 ? ` (${segments.join(", ")})` : "";
  return `📝 Update post: ${slug}${suffix}`;
}
