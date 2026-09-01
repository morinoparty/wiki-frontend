import { getSession } from "@/lib/auth";
import { getHagakiClient, WIKI_REPO } from "@/lib/hagaki";

/**
 * draft 記事の画像プレビュー。
 *
 * draft の `article/<uuid>/assets/*` は配信 worker が 404 にするため、
 * エディタで開き直したときのコミット済み画像はここ経由でリポジトリから
 * 読む。閲覧はエディタ専用なので認証必須。
 */

// どちらのセグメントもリポジトリパスに入る uuid。組み立てる前に弾く。
const UUID_REGEX = /^[a-f0-9-]{36}$/i;

type Params = { params: Promise<{ uuid: string; imageId: string }> };

export async function GET(_request: Request, { params }: Params) {
  // Route Handler はレイアウトの認証を通らないのでここで検証する。
  const session = await getSession();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { uuid, imageId } = await params;
  if (!UUID_REGEX.test(uuid) || !UUID_REGEX.test(imageId)) {
    return new Response("Invalid uuid or imageId", { status: 400 });
  }

  const bytes = await getHagakiClient().files.getBinary(
    `${WIKI_REPO.contentPath}/${uuid}/assets/${imageId}.avif`
  );
  if (!bytes) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "image/avif",
      // 編集中のプレビュー専用。公開後の正規 URL は CDN 側なので、
      // このレスポンスをキャッシュに残さない。
      "Cache-Control": "private, no-store",
    },
  });
}
