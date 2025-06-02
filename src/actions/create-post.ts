"use server";

import { ApiResult, CreatePostInput, OperationContext } from "./types";
import { WikiPostDetail } from "@/types/wiki";
import { GitHubService } from "./services/github-service";
import { ValidationService } from "./services/validation-service";
import { AuthService } from "./services/auth-service";
import { PermissionService } from "./services/permission-service";

/**
 * 新しい記事を作成する
 */
export async function createPost(
  input: CreatePostInput,
  context: OperationContext = {}
): Promise<ApiResult<WikiPostDetail>> {
  try {
    // 1. 認証チェック
    const session = await AuthService.getCurrentSession();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" };
    }

    // 2. 入力データの検証
    const validationResult = ValidationService.validateCreateInput(input);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error };
    }

    // 3. 権限チェック
    const hasPermission = await PermissionService.checkPermission(
      session.user.id,
      "write"
    );
    if (!hasPermission) {
      return { success: false, error: "記事作成の権限がありません" };
    }

    // 4. スラッグの重複チェック
    const exists = await GitHubService.checkPostExists(input.slug);
    if (exists) {
      return { success: false, error: "このスラッグは既に使用されています" };
    }

    // 5. 記事データの準備
    const now = new Date().toISOString();
    const postData: WikiPostDetail = {
      ...input,
      body: input.body,
      date: now, // WikiPostに必要なdateプロパティ
      createdAt: now,
      updatedAt: now,
      createdBy: session.user.id,
      documentOwner: session.user.id,
      lastModifiedBy: session.user.id,
      status: "draft", // 新規作成時は常にdraftステータス
      visibility: input.visibility || "public",
      version: 1,
      isLocked: false,
    };

    // 6. GitHubに保存
    const commitResult = await GitHubService.createPost(
      postData,
      context.commitMessage || `Create post: ${input.title}`,
      session
    );

    if (!commitResult.success) {
      return { success: false, error: commitResult.error };
    }

    return {
      success: true,
      data: postData,
      commitId: commitResult.commitId,
    };
  } catch (error) {
    console.error("Error creating post:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "記事の作成に失敗しました",
    };
  }
}
