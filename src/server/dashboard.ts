import { createServerFn } from "@tanstack/react-start";
import { getSession } from "@/lib/auth";
import { getTakenSlugs } from "@/lib/takenSlugs";
import { toPostActor } from "@/server/services/permission-service";
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
    const actor = toPostActor(await getSession());
    if (!actor) return null;
    return getDashboardPostsEditedBy(actor);
  }
);

/**
 * 新規作成フォームの重複チェック用に、使用中の slug を返す (要認証)。
 *
 * 公開記事と、リポジトリにしか無い記事 (他人の下書き・デプロイ待ちを含む) の
 * slug の和集合。値は `toUrlSlug` 済み (percent-encode 済み) で、記事の
 * タイトルなどは含めない — 見えない下書きの中身を漏らさないため。
 * 取得できないときは空配列を返す (フォームは開けるようにし、最終的な
 * 重複チェックは createPost がサーバー側で行う)。
 */
export const fetchTakenSlugs = createServerFn({ method: "GET" }).handler(
  async (): Promise<string[]> => {
    const actor = toPostActor(await getSession());
    if (!actor) return [];
    try {
      const taken = await getTakenSlugs();
      return [...new Set(taken.map((entry) => entry.slug))];
    } catch (error) {
      console.warn("Failed to load taken slugs:", error);
      return [];
    }
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
