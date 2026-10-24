import { createFileRoute } from "@tanstack/react-router";
import { getRequestOrigin } from "@/lib/request-origin";

/**
 * `/robots.txt`。`Sitemap:` には絶対 URL が必要で、origin は環境ごとに変わる
 * (production / preview / ローカル) ため、静的ファイルではなくリクエスト時に返す。
 * エディタと API はクロール対象から外す。
 */
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const body = [
          "User-agent: *",
          "Disallow: /dashboard",
          "Disallow: /api/",
          "",
          `Sitemap: ${getRequestOrigin()}/sitemap.xml`,
          "",
        ].join("\n");

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
