import { createServerFn } from "@tanstack/react-start";
import type { ApiResult, PostHistoryItem } from "./types";
import { GitHubService } from "./services/github-service";
import { AuthService } from "./services/auth-service";

/** `getPostDiff` の入力。 */
export type PostDiffRequest = {
  slug: string;
  fromCommit: string;
  toCommit: string;
};

/**
 * 記事の履歴を取得
 */
export const getPostHistory = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(
    async ({ data: slug }): Promise<ApiResult<PostHistoryItem[]>> => {
      try {
        // 1. 認証チェック
        const session = await AuthService.getCurrentSession();
        if (!session?.user?.id) {
          return { success: false, error: "認証が必要です" };
        }

        // 2. GitHubから履歴を取得
        const history = await GitHubService.getPostHistory(slug);
        if (!history.success) {
          return { success: false, error: history.error };
        }

        return {
          success: true,
          data: history.data || [],
        };
      } catch (error) {
        console.error("Error getting post history:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "履歴の取得に失敗しました",
        };
      }
    }
  );

/**
 * 記事の差分を取得
 */
export const getPostDiff = createServerFn({ method: "GET" })
  .validator((d: PostDiffRequest) => d)
  .handler(
    async ({
      data: { slug, fromCommit, toCommit },
    }): Promise<ApiResult<string>> => {
      try {
        // 1. 認証チェック
        const session = await AuthService.getCurrentSession();
        if (!session?.user?.id) {
          return { success: false, error: "認証が必要です" };
        }

        // 2. GitHubから差分を取得
        const diff = await GitHubService.getPostDiff(slug, fromCommit, toCommit);
        if (!diff.success) {
          return { success: false, error: diff.error };
        }

        return {
          success: true,
          data: diff.data || "",
        };
      } catch (error) {
        console.error("Error getting post diff:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "差分の取得に失敗しました",
        };
      }
    }
  );
