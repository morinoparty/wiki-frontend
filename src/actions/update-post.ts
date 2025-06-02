"use server";

import { ApiResult, UpdatePostInput, OperationContext } from "./types";
import { WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { ValidationService } from "./services/validation-service";
import { AuthService } from "./services/auth-service";
import { PermissionService } from "./services/permission-service";

/**
 * 既存の記事を更新する
 */
export async function updatePost(
  input: UpdatePostInput,
  context: OperationContext = {}
): Promise<ApiResult<WikiPostDetail>> {
  try {
    // 1. 認証チェック
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    // 2. 入力データの検証
    const validationResult = ValidationService.validateUpdateInput(input);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error };
    }

    // 3. 既存記事の取得
    const existingPost = await GitHubService.getPost(input.slug);
    if (!existingPost) {
      return { success: false, error: "記事が見つかりません" };
    }

    // 4. 権限チェック（ロック状態も含めて一元管理）
    const hasPermission = await PermissionService.checkPostPermission(
      session.user.id,
      existingPost,
      "write"
    );
    if (!hasPermission) {
      return {
        success: false,
        error: existingPost.isLocked
          ? "この記事はロックされています。管理者のみが編集できます"
          : "この記事を編集する権限がありません",
      };
    }

    // 5. 更新データの準備
    const now = new Date().toISOString();
    const updatedPost: WikiPostDetail = {
      ...existingPost,
      ...input,
      updatedAt: now,
      lastModifiedBy: session.user.id,
      version: (existingPost.version || 1) + 1,
    };

    // 6. GitHubに保存
    const commitResult = await GitHubService.updatePost(
      updatedPost,
      context.commitMessage || `Update post: ${updatedPost.title}`,
      session
    );

    if (!commitResult.success) {
      return { success: false, error: commitResult.error };
    }

    return {
      success: true,
      data: updatedPost,
      commitId: commitResult.commitId,
    };
  } catch (error) {
    console.error("Error updating post:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事の更新に失敗しました",
    };
  }
}
