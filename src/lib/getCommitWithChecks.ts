import { Octokit } from "octokit";

// GITHUB_TOKENは環境変数から取得してください
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function getCommitWithChecks({
  owner,
  repo,
  commitSha,
}: {
  owner: string;
  repo: string;
  commitSha: string;
}) {
  // コミット内容取得
  const commit = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{ref}",
    {
      owner,
      repo,
      ref: commitSha,
    }
  );

  // チェックラン取得（GitHub Actions等）
  const checks = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{ref}/check-runs",
    {
      owner,
      repo,
      ref: commitSha,
    }
  );

  return {
    commit: commit.data,
    checks: checks.data,
  };
}
