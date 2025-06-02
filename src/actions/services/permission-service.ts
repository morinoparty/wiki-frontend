import { Permission } from "../types";
import { WikiPostDetail } from "@/types/wiki";
import { AuthService } from "./auth-service";

export class PermissionService {
  /**
   * ユーザーの基本権限をチェック
   */
  static async checkPermission(
    userId: string,
    permission: Permission
  ): Promise<boolean> {
    const userRole = await AuthService.getUserRole(userId);

    switch (permission) {
      case "read":
        return true; // すべてのユーザーが読み取り可能

      case "write":
        return true; // 全てのユーザーが書き込み可能（記事レベルでの制御は別途）

      case "delete":
      case "transfer_ownership":
        return userRole === "admin";

      case "lock":
      case "unlock":
        return userRole === "admin"; // ロック操作は管理者のみ

      case "change_status":
        return true; // 全てのユーザーがステータス変更可能（記事レベルでの制御は別途）

      default:
        return false;
    }
  }

  /**
   * 特定の記事に対する権限をチェック
   */
  static async checkPostPermission(
    userId: string,
    post: WikiPostDetail,
    permission: Permission
  ): Promise<boolean> {
    const userRole = await AuthService.getUserRole(userId);
    const isOwner = post.documentOwner === userId;
    const isCreator = post.createdBy === userId;

    switch (permission) {
      case "read":
        // 可視性に基づく読み取り権限
        switch (post.visibility) {
          case "public":
            return true;
          case "private":
            return isOwner || isCreator || userRole === "admin";
          case "restricted":
            return isOwner || userRole === "admin";
          default:
            return false;
        }

      case "write":
        // ロックされている場合は管理者のみ編集可能
        if (post.isLocked) {
          return userRole === "admin";
        }

        // デフォルトでは誰でも編集可能（ロックされていない場合）
        return true;

      case "delete":
        // ロックされている場合は管理者のみ削除可能
        if (post.isLocked) {
          return userRole === "admin";
        }
        // 通常は所有者または管理者が削除可能
        return isOwner || userRole === "admin";

      case "lock":
      case "unlock":
        // ロック操作は管理者のみ実行可能
        return userRole === "admin";

      case "change_status":
        // ロックされている場合は管理者のみステータス変更可能
        if (post.isLocked) {
          return userRole === "admin";
        }
        // 通常は管理者または所有者がステータス変更可能
        return userRole === "admin" || isOwner;

      case "transfer_ownership":
        // 所有権譲渡は管理者または現在の所有者のみ
        return userRole === "admin" || isOwner;

      default:
        return false;
    }
  }

  /**
   * 複数の権限を一度にチェック
   */
  static async checkMultiplePermissions(
    userId: string,
    permissions: Permission[]
  ): Promise<Record<Permission, boolean>> {
    const results: Partial<Record<Permission, boolean>> = {};

    for (const permission of permissions) {
      results[permission] = await this.checkPermission(userId, permission);
    }

    return results as Record<Permission, boolean>;
  }

  /**
   * 複数の記事に対する権限を一度にチェック
   */
  static async checkMultiplePostPermissions(
    userId: string,
    posts: WikiPostDetail[],
    permission: Permission
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const post of posts) {
      results[post.slug] = await this.checkPostPermission(
        userId,
        post,
        permission
      );
    }

    return results;
  }

  /**
   * ユーザーが編集可能な記事をフィルタリング
   */
  static async filterEditablePosts(
    userId: string,
    posts: WikiPostDetail[]
  ): Promise<WikiPostDetail[]> {
    const editableChecks = await this.checkMultiplePostPermissions(
      userId,
      posts,
      "write"
    );
    return posts.filter((post) => editableChecks[post.slug]);
  }

  /**
   * ユーザーが閲覧可能な記事をフィルタリング
   */
  static async filterReadablePosts(
    userId: string,
    posts: WikiPostDetail[]
  ): Promise<WikiPostDetail[]> {
    const readableChecks = await this.checkMultiplePostPermissions(
      userId,
      posts,
      "read"
    );
    return posts.filter((post) => readableChecks[post.slug]);
  }
}
