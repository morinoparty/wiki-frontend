import { createHagakiClient, type HagakiClient } from "hagaki";
import { getSecret } from "./secrets";

/**
 * wiki コンテンツを保持する GitHub リポジトリ。
 *
 * コンテンツフォーマットは従来どおり `content/wiki/<slug>.md` のままで、
 * hagaki の新フォーマット (content/article/<uuid>/index.mdx) には移行していない。
 * そのため `posts.save` は使わず、パス非依存の `commits.commitFiles` を使う。
 */
export const WIKI_REPO = {
  owner: "morinoparty", // TODO: 環境変数から取得
  repo: "wiki-contentdev", // TODO: 環境変数から取得
  branch: "main",
  contentPath: "content/wiki",
} as const;

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
    });
    clients.set(key, client);
  }
  return client;
}
