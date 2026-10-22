import { createServerFn } from "@tanstack/react-start";
import { getSession } from "@/lib/auth";
import { WIKI_REPO } from "@/lib/content";
import {
  getCommitWithChecks,
  type CheckRunsResult,
  type CommitDetail,
} from "@/lib/getCommitWithChecks";
import {
  getDashboardPosts,
  getDashboardPostsEditedBy,
  type DashboardEditedPost,
  type DashboardPost,
} from "@/lib/getDashboardPosts";

/** ダッシュボードの記事一覧 (draft / デプロイ待ちを含む)。 */
export const fetchDashboardPosts = createServerFn({ method: "GET" }).handler(
  (): Promise<DashboardPost[]> => getDashboardPosts()
);

/** ログイン中のプレイヤーが編集に関わった記事。未ログインなら null。 */
export const fetchMyEditedPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardEditedPost[] | null> => {
    const session = await getSession();
    const playerId = session?.user?.id;
    if (!playerId) return null;
    return getDashboardPostsEditedBy(playerId);
  }
);

/**
 * 保存完了ページ用に、wiki-content のコミット内容とチェックラン (deploy) を取得する。
 * 取得できなければ null (ルート側で notFound にする)。
 */
export const fetchCommitWithChecks = createServerFn({ method: "GET" })
  .validator((commitId: string) => commitId)
  .handler(
    async ({
      data: commitId,
    }): Promise<{ commit: CommitDetail; checks: CheckRunsResult } | null> => {
      try {
        return await getCommitWithChecks({
          owner: WIKI_REPO.owner,
          repo: WIKI_REPO.repo,
          commitSha: commitId,
        });
      } catch (error) {
        console.error("Error fetching commit data:", error);
        return null;
      }
    }
  );
