import { getHagakiClient } from "./hagaki";

/**
 * コミット詳細のうち、UI で参照するフィールドだけを表した構造的な型。
 * hagaki は GitHub のレスポンスを `unknown` で透過するため、ここで形を与える。
 */
export interface CommitDetail {
  html_url: string;
  commit: {
    message: string;
    committer?: { name?: string; date?: string } | null;
  };
}

export interface CheckRun {
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  html_url: string | null;
}

export interface CheckRunsResult {
  total_count: number;
  check_runs: CheckRun[];
}

/**
 * コミット内容と、そのコミットに紐づくチェックラン (GitHub Actions / Workers Builds 等)
 * を取得する。
 *
 * 実処理は hagaki の `commits.getWithChecks` に委譲する。hagaki は owner/repo を
 * クライアント生成時に固定するため、引数の owner/repo ごとにクライアントを引く。
 * 返却形状は従来の Octokit 直叩き版と同一なので、呼び出し側の変更は不要。
 */
export async function getCommitWithChecks({
  owner,
  repo,
  commitSha,
}: {
  owner: string;
  repo: string;
  commitSha: string;
}): Promise<{ commit: CommitDetail; checks: CheckRunsResult }> {
  const hagaki = getHagakiClient({ owner, repo });
  const { commit, checks } = await hagaki.commits.getWithChecks(commitSha);

  return {
    commit: commit as CommitDetail,
    checks: checks as CheckRunsResult,
  };
}
