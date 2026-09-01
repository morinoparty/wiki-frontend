"use server";

import { ApiResult } from "./types";
import { WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { AuthService } from "./services/auth-service";

/**
 * 編集用に記事を uuid で取得する（要認証）。
 *
 * リポジトリから直接読むため、未配信の変更や draft も見える。
 * 公開ページの読み取りは `@/lib/getAllPosts` / `@/lib/getPostBySlug`
 * (CDN 経由、draft は配信されないので自動的に除外) を使うこと。
 */
export async function getPostForEdit(
  uuid: string
): Promise<ApiResult<WikiPostDetail>> {
  try {
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    const post = await GitHubService.getPostByUuid(uuid);
    if (!post) {
      return { success: false, error: "記事が見つかりません" };
    }

    return {
      success: true,
      data: post,
    };
  } catch (error) {
    console.error("Error getting post:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事の取得に失敗しました",
    };
  }
}
