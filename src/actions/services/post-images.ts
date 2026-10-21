import type { CommitFile } from "@morinoparty/hagaki";
import { ImageValidationError, validateAvifUpload } from "@morinoparty/hagaki/image";
import { articleAssetsDir } from "@/lib/content";
import { IMAGE_FORM_FIELDS } from "@/lib/post-images";

/**
 * 記事の保存に載ってきた画像を、本文と同じコミットに入れられる形にする。
 *
 * 画像はブラウザで AVIF にエンコードされ、保存時に FormData で届く
 * (`src/lib/post-images.ts`)。クライアントが送る id やファイル名は信用せず、
 * 記事の uuid と画像 id を uuid の形か確かめたうえでパスをサーバー側で組み立てる
 * (`../../.github/workflows/x.yml` のような名前で記事の外へ書かせない)。
 */

/** 画像 id はファイル名を兼ねるので uuid のみ許す。 */
const UUID_REGEX = /^[a-f0-9-]{36}$/i;

/** ユーザーにそのまま見せてよい、画像まわりの入力エラー。 */
export class PostImageError extends Error {}

/**
 * 記事は自分のディレクトリしか触れない。追加・削除するパスは必ず
 * `content/article/<uuid>/assets/` の下でなければならない。
 */
export function assertOwnedAssetPath(path: string, postUuid: string): void {
  const prefix = articleAssetsDir(postUuid);
  if (!path.startsWith(prefix) || path.includes("..") || path.endsWith("/")) {
    throw new PostImageError(`記事の assets 外のパスは操作できません: ${path}`);
  }
}

/**
 * FormData の画像を検証し、`posts.save` の `files` に渡せる形で返す。
 * 1 枚でも不正なら PostImageError — 保存を通すと本文が存在しない画像を
 * 参照したままコミットされる。
 */
export async function readImageUploads(
  postUuid: string,
  form: FormData | undefined,
): Promise<CommitFile[]> {
  if (!form) return [];
  if (!UUID_REGEX.test(postUuid)) {
    throw new PostImageError(`記事の uuid が不正です: ${postUuid}`);
  }

  const ids = form.getAll(IMAGE_FORM_FIELDS.id);
  const blobs = form.getAll(IMAGE_FORM_FIELDS.file);
  if (ids.length !== blobs.length) {
    throw new PostImageError("画像 ID と画像の数が一致しません");
  }

  const seen = new Set<string>();
  const files: CommitFile[] = [];
  for (const [i, imageId] of ids.entries()) {
    if (typeof imageId !== "string" || !UUID_REGEX.test(imageId)) {
      throw new PostImageError("画像 ID が不正です");
    }
    if (seen.has(imageId)) continue;
    seen.add(imageId);

    const blob = blobs[i];
    if (!(blob instanceof Blob)) {
      throw new PostImageError("画像データが不正です");
    }
    const content = new Uint8Array(await blob.arrayBuffer());
    try {
      // 500KB 以下の AVIF か
      validateAvifUpload(content);
    } catch (error) {
      if (error instanceof ImageValidationError) {
        throw new PostImageError(
          error.code === "size"
            ? "画像が大きすぎます (1 枚 500KB 以下の AVIF にしてください)"
            : "画像は AVIF 形式のみ受け付けます",
        );
      }
      throw error;
    }

    // パスは id から作る。Blob の name は使わない
    const path = `${articleAssetsDir(postUuid)}${imageId}.avif`;
    assertOwnedAssetPath(path, postUuid);
    files.push({ path, content });
  }
  return files;
}

/** コミットメッセージに画像の増減を書き添える。 */
export function postCommitMessage(
  slug: string,
  added: number,
  removed: number,
): string {
  const segments: string[] = [];
  if (added > 0) segments.push(`+${added} image${added === 1 ? "" : "s"}`);
  if (removed > 0) segments.push(`-${removed} image${removed === 1 ? "" : "s"}`);
  const suffix = segments.length > 0 ? ` (${segments.join(", ")})` : "";
  return `📝 Update post: ${slug}${suffix}`;
}
