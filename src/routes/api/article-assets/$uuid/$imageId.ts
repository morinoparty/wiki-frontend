import { createFileRoute } from "@tanstack/react-router";
import { getSession } from "@/lib/auth";
import { articleAssetsDir, articleImageUrl } from "@/lib/content";
import { getHagakiClient } from "@/lib/hagaki";

/**
 * エディタ用の記事画像。CDN が持っていればそこへ、無ければリポジトリから返す。
 *
 * CDN には「まだ無い」時期が二通りある:
 *   - 下書き: 配信 worker が draft の assets を 404 にするので永続的に無い
 *   - 保存直後: コミットは済んでいるが wiki-content のデプロイ待ち (数十秒)
 *
 * 保存が成功するとブラウザ側の画像 (Blob) は破棄されるため、この二つの窓では
 * リポジトリだけが画像を持っている。配信済みなら CDN へリダイレクトして
 * ブラウザキャッシュに乗せ、無いときだけリポジトリの実体を返す。
 *
 * 閲覧はエディタ専用なので認証必須。
 */

// どちらのセグメントもリポジトリパスに入る uuid。組み立てる前に弾く。
const UUID_REGEX = /^[a-f0-9-]{36}$/i;

export const Route = createFileRoute("/api/article-assets/$uuid/$imageId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        // サーバールートはレイアウトの認証を通らないのでここで検証する。
        const session = await getSession();
        if (!session?.user?.id) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }

        const { uuid, imageId } = params;
        if (!UUID_REGEX.test(uuid) || !UUID_REGEX.test(imageId)) {
          return new Response("Invalid uuid or imageId", { status: 400 });
        }

        // 下書きは配信されないと分かっているので CDN を試さない (`?draft=1`)。
        // 判定を誤っても結果は変わらない — 単なる往復の節約。
        const skipCdn = new URL(request.url).searchParams.get("draft") === "1";
        if (!skipCdn) {
          const cdnUrl = articleImageUrl(uuid, imageId);
          try {
            const head = await fetch(cdnUrl, { method: "HEAD" });
            if (head.ok) return Response.redirect(cdnUrl, 302);
          } catch {
            // CDN に届かないときはリポジトリから読む
          }
        }

        const bytes = await getHagakiClient().files.getBinary(
          `${articleAssetsDir(uuid)}${imageId}.avif`
        );
        if (!bytes) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(bytes as BodyInit, {
          headers: {
            "Content-Type": "image/avif",
            // 編集中のプレビュー専用。配信されれば上のリダイレクトで CDN に
            // 移るので、この応答をキャッシュに残さない。
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});
