"use server";

import { ApiResult } from "./types";
import { GitHubService } from "./services/github-service";
import { AuthService } from "./services/auth-service";

/**
 * 画像をアップロードして GitHub の content/img 配下に保存する
 */
export async function uploadImage(
  file: File
): Promise<ApiResult<{ url: string }>> {
  try {
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    const result = await GitHubService.uploadImage(file, session);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: { url: result.url! }, commitId: result.commitId };
  } catch (error) {
    console.error("Image upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "画像アップロードに失敗しました",
    };
  }
}
