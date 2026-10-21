"use client";

import type { ImageComponentAttrs } from "@morinoparty/hagaki/markdown";
import {
  collectPendingImages,
  type PendingImage,
  PendingImageError,
  startPending,
} from "@morinoparty/hagaki/pending-images";
import {
  IMAGE_FORM_FIELDS,
  SAVE_REQUEST_LIMIT_BYTES,
  SAVE_REQUEST_LIMIT_LABEL,
  SAVE_REQUEST_OVERHEAD_BYTES,
} from "@/lib/post-images";

/**
 * 編集中の画像は、保存するまでどこにもアップロードしない。
 *
 * 1. `startPending` が blurhash と寸法を確定した時点で `<Image imageId="…" />`
 *    を挿入し、プレースホルダを出す。AVIF エンコードは裏で続く
 * 2. エンコードが終わると `getPending(id).previewUrl` (`blob:` URL) で表示する
 * 3. 保存時に未コミットの画像の Blob を集め、本文と一緒に Server Action へ
 *    送って 1 コミットにする (`buildImageForm`)
 *
 * Blob はこのタブのメモリにしか無いので、保存前にリロードすると失われる。
 */

/** 記事画像の URL 前置き。`/article/<uuid>/assets/<imageId>.avif`。 */
export function imageUrlPrefix(postUuid: string): string {
  return `/article/${postUuid}/assets/`;
}

/**
 * コミット済み画像の表示 URL。
 *
 * CDN を直接見ずに article-assets ルートを挟む。保存直後は wiki-content の
 * デプロイが終わるまでの数十秒、下書きなら永久に、CDN に画像が無い。
 * ルート側が配信済みかを見て CDN へリダイレクトするか実体を返すかを選ぶ。
 */
export function committedImageUrl(
  imageId: string,
  postUuid: string,
  draft?: boolean
): string {
  // 下書きと分かっているときは CDN の確認を省かせる。
  return `/api/article-assets/${postUuid}/${imageId}${draft ? "?draft=1" : ""}`;
}

/**
 * エディタの `onInsertImage`。`startPending` は blurhash が出た時点で
 * resolve するので、エンコードを待たずに `<Image />` を挿入できる。
 */
export async function handleInsertImage(
  file: File
): Promise<ImageComponentAttrs> {
  const entry = await startPending({ file });
  return {
    id: entry.id,
    blurhash: entry.blurhash,
    width: entry.width,
    height: entry.height,
    alt: "",
  };
}

/** 保存前に分かる、ユーザーに見せるべき画像の問題。 */
export class SaveImagesError extends Error {}

/**
 * 保存リクエストに載せる画像を集めて FormData にする。
 *
 * エンコードの完了を待ち、失敗した画像やリロードで失われた画像があれば
 * SaveImagesError を投げる。送る前にサイズを見積もり、Server Action の上限を
 * 超えるならここで止める (送ってからだと汎用のエラーにしかならない)。
 */
export async function buildImageForm(
  imageIds: string[],
  body: string
): Promise<{ form: FormData; images: PendingImage[] }> {
  let images: PendingImage[];
  try {
    images = await collectPendingImages(imageIds);
  } catch (error) {
    if (error instanceof PendingImageError) {
      throw new SaveImagesError(
        error.failedIds.length > 0
          ? `画像 ${error.failedIds.length} 枚の変換に失敗しました。削除するか挿入し直してから保存してください`
          : `画像 ${error.missingIds.length} 枚のデータがありません (保存前にページを再読み込みすると失われます)。挿入し直してから保存してください`
      );
    }
    throw error;
  }

  const imageBytes = images.reduce((sum, { blob }) => sum + blob.size, 0);
  const bodyBytes = new TextEncoder().encode(body).length;
  if (
    imageBytes + bodyBytes + SAVE_REQUEST_OVERHEAD_BYTES >
    SAVE_REQUEST_LIMIT_BYTES
  ) {
    throw new SaveImagesError(
      `1 回の保存で送れるのは ${SAVE_REQUEST_LIMIT_LABEL} までです (画像 ${images.length} 枚で約 ${(imageBytes / 1024 / 1024).toFixed(1)}MB)。新しい画像を何枚か外して保存し、残りは保存のあとで挿入し直してください`
    );
  }

  const form = new FormData();
  for (const { imageId, blob } of images) {
    form.append(IMAGE_FORM_FIELDS.id, imageId);
    form.append(IMAGE_FORM_FIELDS.file, blob, `${imageId}.avif`);
  }
  return { form, images };
}
