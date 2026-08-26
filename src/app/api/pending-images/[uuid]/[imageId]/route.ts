import {
  ImageValidationError,
  MAX_AVIF_BYTES,
  validateAvifUpload,
} from "hagaki/image";
import { getSession } from "@/lib/auth";
// バインディングは `cloudflare:workers` の静的 import を避けて取る
// (理由は getPendingImagesBucket の説明を参照)。
import { getPendingImagesBucket } from "@/actions/services/pending-images";

/**
 * 編集中の画像の一時置き場。エディタは AVIF を用意でき次第ここに PUT し、
 * 記事を保存するまでは GET でプレビューを取る。保存時に記事本文と同じ
 * コミットへ移され、その後 pending オブジェクトは削除される。
 *
 * オブジェクトは `PENDING_IMAGES` バケットの
 * `pending/<postUuid>/<imageId>.avif`。保存されないまま残ったものは
 * `pending/` に付けたライフサイクルルールが掃除する (wrangler.jsonc)。
 *
 * このプロジェクトはデータ操作を Server Actions に寄せているが、ここだけは
 * Route Handler にしている。生の AVIF バイト列を PUT / GET するのに
 * Server Action の RSC ペイロードを経由させる理由がないため。
 */

// どちらのセグメントも R2 のキーに入る uuid。キーを組み立てる前に弾く。
const UUID_REGEX = /^[a-f0-9-]{36}$/i;

function pendingKey(uuid: string, imageId: string): string | null {
  if (!UUID_REGEX.test(uuid) || !UUID_REGEX.test(imageId)) return null;
  return `pending/${uuid}/${imageId}.avif`;
}

type Params = { params: Promise<{ uuid: string; imageId: string }> };

export async function PUT(request: Request, { params }: Params) {
  // 書き込みはエディタ専用。Route Handler はレイアウトの認証を通らないので
  // ここで検証する。
  const session = await getSession();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { uuid, imageId } = await params;
  const key = pendingKey(uuid, imageId);
  if (!key) {
    return new Response("Invalid uuid or imageId", { status: 400 });
  }

  // バッファリングする前にサイズを弾く。これが無いと、巨大なボディを
  // validateAvifUpload のサイズ検査より先に isolate が全部読んでしまう。
  // エディタは長さの決まった Uint8Array を送るので、Content-Length が
  // 無いリクエストは他のクライアント由来として拒否する。
  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return new Response("Content-Length required", { status: 411 });
  }
  if (contentLength > MAX_AVIF_BYTES) {
    return new Response("Payload too large", { status: 413 });
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  try {
    // コミット時と同じ 500KB + `ftyp` の検査。後で拒否するバイト列を
    // ここに置かない。
    validateAvifUpload(bytes);
  } catch (error) {
    if (error instanceof ImageValidationError) {
      return new Response(error.message, { status: 400 });
    }
    throw error;
  }

  const bucket = await getPendingImagesBucket();
  await bucket.put(key, bytes, {
    httpMetadata: { contentType: "image/avif" },
  });
  return Response.json({ ok: true });
}

export async function GET(_request: Request, { params }: Params) {
  const { uuid, imageId } = await params;
  const key = pendingKey(uuid, imageId);
  if (!key) {
    return new Response("Invalid uuid or imageId", { status: 400 });
  }

  const bucket = await getPendingImagesBucket();
  const object = await bucket.get(key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(object.body, {
    headers: {
      "Content-Type": "image/avif",
      // プレビュー専用。保存後の正規 URL は CDN 側なので、
      // このレスポンスをキャッシュに残さない。
      "Cache-Control": "private, no-store",
    },
  });
}
