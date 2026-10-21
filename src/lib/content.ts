/**
 * wiki コンテンツの置き場所。クライアントコンポーネントからも読むので、
 * サーバー専用のもの (secret, hagaki client) はここに置かない。
 */

/**
 * wiki コンテンツを保持する GitHub リポジトリ。
 *
 * コンテンツは hagaki のフォーマット (content/article/<uuid>/index.mdx +
 * assets/<imageId>.avif) で管理し、Worker `wiki-content` が
 * `CONTENT_BASE_URL` から配信する。
 */
export const WIKI_REPO = {
  owner: "morinoparty",
  repo: "wiki-content",
  branch: "main",
  contentPath: "content/article",
} as const;

/**
 * 生成物 (article.json / slug-index.json / categories.json) と記事本体の配信元
 * (Worker `wiki-content` の workers.dev URL)。サーバーとブラウザの両方で使うので
 * env ではなくビルドに埋め込む定数にしている。
 */
export const CONTENT_BASE_URL = "https://wiki-content.morinoparty.workers.dev";

/** 記事の assets ディレクトリ (リポジトリ上のパス)。末尾は `/`。 */
export function articleAssetsDir(articleId: string): string {
  return `${WIKI_REPO.contentPath}/${articleId}/assets/`;
}

/** 記事に属する画像の URL。`content/article/<uuid>/assets/<imageId>.avif`。 */
export function articleImageUrl(articleId: string, imageId: string): string {
  return `${CONTENT_BASE_URL}/article/${encodeURIComponent(articleId)}/assets/${encodeURIComponent(imageId)}.avif`;
}
