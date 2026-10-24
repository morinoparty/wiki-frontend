import { createFileRoute } from "@tanstack/react-router";
import { getAllCategories } from "@/lib/getAllCategories";
import { getAllPosts } from "@/lib/getAllPosts";
import { getRequestOrigin } from "@/lib/request-origin";

/**
 * 公開ページの sitemap (`/sitemap.xml`)。
 *
 * 記事とカテゴリは配信中の wiki-content (`article.json` / `categories.json`) から
 * リクエスト時に組み立てる。draft や未デプロイの記事はマニフェストに載らないので
 * ここにも出ない。ダッシュボードとサインインは公開ページではないので含めない。
 */

interface SitemapEntry {
  /** origin からのパス (先頭 `/`)。 */
  path: string;
  /** ISO 8601 の最終更新日時。不明なら省略する。 */
  lastmod?: string;
}

/** XML のテキストノード・属性値に入れる文字列をエスケープする。 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** sitemap プロトコル (0.9) の XML を組み立てる。 */
function renderSitemap(origin: string, entries: SitemapEntry[]): string {
  const urls = entries.map(({ path, lastmod }) => {
    const loc = `<loc>${escapeXml(origin + path)}</loc>`;
    return lastmod
      ? `  <url>${loc}<lastmod>${escapeXml(lastmod)}</lastmod></url>`
      : `  <url>${loc}</url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [posts, categories] = await Promise.all([
          getAllPosts(),
          getAllCategories(),
        ]);

        const entries: SitemapEntry[] = [
          // トップの最終更新は一番新しい記事に合わせる (一覧は updated 降順)
          { path: "/", lastmod: posts[0]?.updated ?? undefined },
          { path: "/category" },
          { path: "/license" },
          ...categories.map((category) => ({
            path: `/category/${encodeURIComponent(category.slug)}`,
          })),
          ...posts.map((post) => ({
            path: `/${encodeURIComponent(post.slug)}`,
            lastmod: post.updated ?? post.created ?? undefined,
          })),
        ];

        return new Response(renderSitemap(getRequestOrigin(), entries), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            // 記事の公開は wiki-content のデプロイ後なので、多少の遅れは許容する
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
