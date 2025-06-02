"use server";

import {
  ApiResult,
  StatusChangeInput,
  OwnershipTransferInput,
  OperationContext,
} from "./types";
import { WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { AuthService } from "./services/auth-service";
import { PermissionService } from "./services/permission-service";

/**
 * 記事のステータスを変更する
 */
export async function changePostStatus(
  input: StatusChangeInput,
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
      "change_status"
    );
    if (!hasPermission) {
      return {
        success: false,
        error: "この記事のステータスを変更する権限がありません",
      };
    }

    // 4. ロックチェック
    if (
      existingPost.isLocked &&
      existingPost.documentOwner !== session.user.id
    ) {
      return {
        success: false,
        error: "ロックされた記事のステータスは所有者のみが変更できます",
      };
    }

    // 5. 同じステータスかチェック
    if (existingPost.status === input.status) {
      return { success: false, error: "既に同じステータスです" };
    }

    // 6. ステータス更新
    const now = new Date().toISOString();
    const updatedPost: WikiPostDetail = {
      ...existingPost,
      status: input.status,
      lastModifiedBy: session.user.id,
      updatedAt: now,
    };

    // 7. GitHubに保存
    const commitResult = await GitHubService.updatePost(
      updatedPost,
      context.commitMessage ||
        `Change status to ${input.status}: ${existingPost.title} (${input.reason || "No reason provided"})`,
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
    console.error("Error changing post status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ステータスの変更に失敗しました",
    };
  }
}

/**
 * 記事の所有者を変更する
 */
export async function transferPostOwnership(
  input: OwnershipTransferInput,
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
      "transfer_ownership"
    );
    if (!hasPermission) {
      return {
        success: false,
        error: "この記事の所有者を変更する権限がありません",
      };
    }

    // 4. 現在の所有者かチェック
    if (existingPost.documentOwner !== session.user.id) {
      return { success: false, error: "所有者のみが所有権を譲渡できます" };
    }

    // 5. 新しい所有者の存在チェック（実装に応じて）
    const newOwnerExists = await AuthService.checkUserExists(input.newOwnerId);
    if (!newOwnerExists) {
      return { success: false, error: "指定されたユーザーが見つかりません" };
    }

    // 6. 所有者情報の更新
    const now = new Date().toISOString();
    const transferredPost: WikiPostDetail = {
      ...existingPost,
      documentOwner: input.newOwnerId,
      lastModifiedBy: session.user.id,
      updatedAt: now,
      // ロックされている場合は解除
      isLocked: false,
      lockedAt: undefined,
      lockedBy: undefined,
    };

    // 7. GitHubに保存
    const commitResult = await GitHubService.updatePost(
      transferredPost,
      context.commitMessage ||
        `Transfer ownership to ${input.newOwnerId}: ${existingPost.title} (${input.reason || "No reason provided"})`,
      session
    );

    if (!commitResult.success) {
      return { success: false, error: commitResult.error };
    }

    return {
      success: true,
      data: transferredPost,
      commitId: commitResult.commitId,
    };
  } catch (error) {
    console.error("Error transferring post ownership:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "所有権の譲渡に失敗しました",
    };
  }
}

/**
 * 記事を削除する
 */
export async function deletePost(
  slug: string,
  context: OperationContext = {}
): Promise<ApiResult> {
  try {
    // 1. 認証チェック
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    // 2. 既存記事の取得
    const existingPost = await GitHubService.getPost(slug);
    if (!existingPost) {
      return { success: false, error: "記事が見つかりません" };
    }

    // 3. 権限チェック
    const hasPermission = await PermissionService.checkPostPermission(
      session.user.id,
      existingPost,
      "delete"
    );
    if (!hasPermission) {
      return { success: false, error: "この記事を削除する権限がありません" };
    }

    // 4. GitHubから削除
    const deleteResult = await GitHubService.deletePost(
      slug,
      context.commitMessage || `Delete post: ${existingPost.title}`,
      session
    );

    if (!deleteResult.success) {
      return { success: false, error: deleteResult.error };
    }

    return {
      success: true,
      commitId: deleteResult.commitId,
    };
  } catch (error) {
    console.error("Error deleting post:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事の削除に失敗しました",
    };
  }
}
