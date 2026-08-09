import { createHagakiClient, type HagakiClient } from "hagaki";
import { getSecret } from "./secrets";

/**
 * wiki コンテンツを保持する GitHub リポジトリ。
 *
 * コンテンツは hagaki のフォーマット (content/article/<uuid>/index.mdx +
 * assets/<imageId>.avif) で管理し、Cloudflare Workers Assets 経由で
 * `CONTENT_BASE_URL` から配信される。
 */
export const WIKI_REPO = {
  owner: "Nlkomaru",
  repo: "wiki-content",
  branch: "main",
  contentPath: "content/article",
} as const;

/** 生成物 (article.json / slug-index.json / categories.json) と記事本体の配信元。 */
export const CONTENT_BASE_URL = "https://wiki-content.moripa.nikomaru.dev";

/** 記事に属する画像の URL。`content/article/<uuid>/assets/<imageId>.avif`。 */
export function articleImageUrl(articleId: string, imageId: string): string {
  return `${CONTENT_BASE_URL}/article/${encodeURIComponent(articleId)}/assets/${encodeURIComponent(imageId)}.avif`;
}

export interface GitHubRepoRef {
  owner: string;
  repo: string;
  branch?: string;
  contentPath?: string;
}

const clients = new Map<string, HagakiClient>();

/**
 * hagaki クライアントを owner/repo/branch ごとにメモ化して返す。
 *
 * Octokit インスタンスは hagaki 側で各メソッド呼び出し時に生成され、
 * `auth` も毎回解決される。そのためクライアント自体をキャッシュしても
 * トークンがモジュール初期化時の値に固定されることはない。
 */
export function getHagakiClient(repo: GitHubRepoRef = WIKI_REPO): HagakiClient {
  const branch = repo.branch ?? WIKI_REPO.branch;
  const key = `${repo.owner}/${repo.repo}@${branch}`;

  let client = clients.get(key);
  if (!client) {
    client = createHagakiClient({
      github: {
        owner: repo.owner,
        repo: repo.repo,
        branch,
        contentPath: repo.contentPath ?? WIKI_REPO.contentPath,
        // 関数で渡すことで、モジュール初期化時ではなく呼び出し時に解決される。
        // Workers では Secrets Store バインディング、ローカルでは環境変数。
        auth: async () => (await getSecret("GITHUB_TOKEN")) ?? "",
      },
      content: {
        cdnBaseUrl: CONTENT_BASE_URL,
      },
    });
    clients.set(key, client);
  }
  return client;
}
