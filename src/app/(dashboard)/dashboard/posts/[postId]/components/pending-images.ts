"use client";

import { resolveCdnUrl } from "hagaki";
import {
  extractImageComponentIds,
  type ImageComponentAttrs,
} from "hagaki/markdown";
import {
  getPending,
  listPending,
  removePending,
  startPending,
} from "hagaki/pending-images";
import { CONTENT_BASE_URL } from "@/lib/hagaki";

/**
 * 編集中の画像は、記事ごとに 1 コミットへまとめるため R2 の一時置き場を経由する。
 *
 * 1. `startPending` が blurhash と寸法を確定した時点で `<Image imageId="…" />`
 *    を挿入し、プレースホルダを出す
 * 2. AVIF エンコードと `/api/pending-images/...` への PUT はバックグラウンド
 * 3. 保存時に本文が参照する未コミットの id を集め、アップロードの完了を待って
 *    から記事本文と同じコミットに載せる
 */

/** 記事画像の URL 前置き。`/article/<uuid>/assets/<imageId>.avif`。 */
export function imageUrlPrefix(postUuid: string): string {
  return `/article/${postUuid}/assets/`;
}

/** 編集中のプレビュー URL (Workers 経由で R2 から返る)。 */
export function pendingImagePreviewUrl(
  postUuid: string,
  imageId: string
): string {
  return `/api/pending-images/${postUuid}/${imageId}`;
}

/**
 * コミット済み画像の表示 URL。公開記事は CDN、draft は配信 worker に
 * 遮断されるため認証付きの draft-assets ルート経由でリポジトリから読む。
 */
export function committedImageUrl(
  imageId: string,
  postUuid: string,
  draft?: boolean
): string {
  if (draft) {
    return `/api/draft-assets/${postUuid}/${imageId}`;
  }
  return resolveCdnUrl(
    `${imageUrlPrefix(postUuid)}${imageId}.avif`,
    CONTENT_BASE_URL
  );
}

/**
 * エディタの `onInsertImage`。`startPending` は blurhash が出た時点で
 * resolve するので、エンコードを待たずに `<Image />` を挿入できる。
 */
export async function handleInsertImage(
  file: File,
  postUuid: string
): Promise<ImageComponentAttrs> {
  const entry = await startPending({
    file,
    upload: async ({ id, avif }) => {
      const url = pendingImagePreviewUrl(postUuid, id);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: avif as BodyInit,
      });
      if (!res.ok) {
        throw new Error(
          `画像のアップロードに失敗しました: ${res.status} ${res.statusText}`
        );
      }
      return url;
    },
  });
  return {
    id: entry.id,
    blurhash: entry.blurhash,
    width: entry.width,
    height: entry.height,
    alt: "",
  };
}

/**
 * 本文から消えた失敗エントリを掃除する。`<Image />` を Backspace や undo で
 * 消しても `removePending` は呼ばれないため、放置すると失敗エントリが残り
 * 続けて保存ボタンが永久に無効化される。エディタの onChange から毎回呼ぶ
 * 想定なので markdown をパースせず id の部分文字列一致で判定する。
 * error のエントリだけを対象にするので、undo で `<Image />` が本文に戻っても
 * 進行中・アップロード済みのエントリを誤って捨てない。
 */
export function sweepOrphanedImageErrors(body: string): void {
  for (const entry of listPending()) {
    if (entry.status === "error" && !body.includes(entry.id)) {
      removePending(entry.id);
    }
  }
}

/**
 * 保存ペイロードの組み立て。本文の書き換えは不要で、まだコミットされていない
 * 画像 id を集めてアップロードの完了だけ待つ。
 *
 * store に無い id (リロード後など) もそのまま送る。R2 に残っていればサーバー
 * 側で回収でき、無ければサーバーがユーザー向けのエラーで拒否する。
 */
export async function collectPendingImageIds(
  markdown: string,
  committedBody: string
): Promise<string[]> {
  const committedIds = new Set(extractImageComponentIds(committedBody));
  const pendingImageIds = extractImageComponentIds(markdown).filter(
    (id) => !committedIds.has(id)
  );

  for (const id of pendingImageIds) {
    const entry = getPending(id);
    if (!entry) continue;
    try {
      await entry.done;
    } catch {
      throw new Error(
        "画像のアップロードに失敗しました。失敗した画像を削除するか挿入し直してから保存してください"
      );
    }
  }
  return pendingImageIds;
}
