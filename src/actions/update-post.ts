"use server";

import { ApiResult, UpdatePostInput, OperationContext } from "./types";
import { WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { ValidationService } from "./services/validation-service";
import { AuthService } from "./services/auth-service";
import { PermissionService } from "./services/permission-service";
import { getAllCategories } from "@/lib/getAllCategories";
import { postCommitMessage } from "./services/pending-images";
import { hasPositionOption } from "@/lib/categoryOptions";

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

    // 5. カテゴリの座標要件チェック（カテゴリが更新される場合）
    if (input.category && input.category !== existingPost.category) {
      const categories = await getAllCategories();
      const newCategory = categories.find((cat) => cat.slug === input.category);
      if (!newCategory) {
        return { success: false, error: "指定されたカテゴリが見つかりません" };
      }

      // カテゴリが option で x / y を宣言している場合、座標情報が必須
      if (hasPositionOption(newCategory)) {
        if (input.x === undefined || input.y === undefined) {
          return {
            success: false,
            error: "このカテゴリでは座標情報（X座標、Y座標）の入力が必要です",
          };
        }
        if (!Number.isInteger(input.x) || !Number.isInteger(input.y)) {
          return {
            success: false,
            error: "座標は整数で入力してください",
          };
        }
      }
    }

    // 6. 更新データの準備
    const now = new Date().toISOString();
    const updatedPost: WikiPostDetail = {
      ...existingPost,
      ...input,
      updatedAt: now,
      lastModifiedBy: session.user.id,
      version: (existingPost.version || 1) + 1,
    };

    // 7. GitHubに保存
    const pendingImageIds = context.pendingImageIds ?? [];
    const deletePaths = context.deletePaths ?? [];
    const commitResult = await GitHubService.updatePost(
      updatedPost,
      context.commitMessage ||
        postCommitMessage(
          updatedPost.slug,
          pendingImageIds.length,
          deletePaths.length
        ),
      session,
      { pendingImageIds, deletePaths }
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
