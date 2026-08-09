"use server";

import { ApiResult } from "./types";
import { GitHubService } from "./services/github-service";
import { AuthService } from "./services/auth-service";

/**
 * 画像を記事の assets 配下 (content/article/<articleId>/assets/<imageId>.avif)
 * に保存する。
 *
 * コンテンツフォーマット上、記事画像は記事に属する AVIF ファイルなので、
 * どの記事に属するか (articleId = 記事の uuid) が必須。
 */
export async function uploadImage(
  file: File,
  articleId: string
): Promise<ApiResult<{ imageId: string; url: string }>> {
  try {
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }
    if (!articleId) {
      return { success: false, error: "記事が特定できません" };
    }

    const result = await GitHubService.uploadImage(file, session, articleId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: { imageId: result.imageId!, url: result.url! },
      commitId: result.commitId,
    };
  } catch (error) {
    console.error("Image upload error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "画像アップロードに失敗しました",
    };
  }
}
