import { createHagakiClient, type HagakiClient } from "@morinoparty/hagaki";
import { CONTENT_BASE_URL, WIKI_REPO } from "./content";
import { getEnv } from "./env";

export interface GitHubRepoRef {
  owner: string;
  repo: string;
  branch?: string;
  contentPath?: string;
}

const clients = new Map<string, HagakiClient>();

/**
 * hagaki クライアントを owner/repo/branch ごとにメモ化して返す (サーバー専用)。
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
        // 関数で渡すことで、モジュール初期化時ではなく呼び出し時に解決される
        auth: async () => (await getEnv("HAGAKI_GITHUB_TOKEN")) ?? "",
      },
      content: {
        cdnBaseUrl: CONTENT_BASE_URL,
      },
    });
    clients.set(key, client);
  }
  return client;
}
