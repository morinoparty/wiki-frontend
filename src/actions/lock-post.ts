"use server";

import { ApiResult, LockOperationInput, OperationContext } from "./types";
import { WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { AuthService } from "./services/auth-service";
import { PermissionService } from "./services/permission-service";

/**
 * 記事をロックする
 */
export async function lockPost(
  input: LockOperationInput,
  context: OperationContext = {}
): Promise<ApiResult<WikiPostDetail>> {
  try {
    // 1. 認証チェック
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    // 2. 既存記事の取得
    const existingPost = await GitHubService.getPost(input.slug);
    if (!existingPost) {
      return { success: false, error: "記事が見つかりません" };
    }

    // 3. 権限チェック
    const hasPermission = await PermissionService.checkPostPermission(
      session.user.id,
      existingPost,
      "lock"
    );
    if (!hasPermission) {
      return { success: false, error: "この記事をロックする権限がありません" };
    }

    // 4. 既にロックされているかチェック
    if (existingPost.isLocked) {
      return { success: false, error: "記事は既にロックされています" };
    }

    // 5. ロック情報の更新
    const now = new Date().toISOString();
    const lockedPost: WikiPostDetail = {
      ...existingPost,
      isLocked: true,
      lockedAt: now,
      lockedBy: session.user.id,
      lastModifiedBy: session.user.id,
      updatedAt: now,
    };

    // 6. GitHubに保存
    const commitResult = await GitHubService.updatePost(
      lockedPost,
      context.commitMessage ||
        `Lock post: ${existingPost.title} (${input.reason || "No reason provided"})`,
      session
    );

    if (!commitResult.success) {
      return { success: false, error: commitResult.error };
    }

    return {
      success: true,
      data: lockedPost,
      commitId: commitResult.commitId,
    };
  } catch (error) {
    console.error("Error locking post:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事のロックに失敗しました",
    };
  }
}

/**
 * 記事のロックを解除する
 */
export async function unlockPost(
  input: LockOperationInput,
  context: OperationContext = {}
): Promise<ApiResult<WikiPostDetail>> {
  try {
    // 1. 認証チェック
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    // 2. 既存記事の取得
    const existingPost = await GitHubService.getPost(input.slug);
    if (!existingPost) {
      return { success: false, error: "記事が見つかりません" };
    }

    // 3. 権限チェック
    const hasPermission = await PermissionService.checkPostPermission(
      session.user.id,
      existingPost,
      "unlock"
    );
    if (!hasPermission) {
      return {
        success: false,
        error: "この記事のロックを解除する権限がありません",
      };
    }

    // 4. ロックされているかチェック
    if (!existingPost.isLocked) {
      return { success: false, error: "記事はロックされていません" };
    }

    // 5. ロック解除情報の更新
    const now = new Date().toISOString();
    const unlockedPost: WikiPostDetail = {
      ...existingPost,
      isLocked: false,
      lockedAt: undefined,
      lockedBy: undefined,
      lastModifiedBy: session.user.id,
      updatedAt: now,
    };

    // 6. GitHubに保存
    const commitResult = await GitHubService.updatePost(
      unlockedPost,
      context.commitMessage ||
        `Unlock post: ${existingPost.title} (${input.reason || "No reason provided"})`,
      session
    );

    if (!commitResult.success) {
      return { success: false, error: commitResult.error };
    }

    return {
      success: true,
      data: unlockedPost,
      commitId: commitResult.commitId,
    };
  } catch (error) {
    console.error("Error unlocking post:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "記事のロック解除に失敗しました",
    };
  }
}
