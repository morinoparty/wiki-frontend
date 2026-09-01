import { Permission } from "../types";
import { WikiPostDetail } from "@/types/wiki";
import { AuthService } from "./auth-service";

/**
 * role ベースの権限チェック。
 *
 * 記事の公開状態は hagaki の `draft` (配信側で遮断される) が担うため、
 * ここでは「誰が何を操作できるか」だけを見る。
 */
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
        return true; // 全てのユーザーが書き込み可能

      case "delete":
        return userRole === "admin";

      default:
        return false;
    }
  }

  /**
   * 特定の記事に対する権限をチェック。
   * 現状は記事ごとの差が無いため基本権限に委譲するが、呼び出し側の
   * シグネチャは記事単位のまま保ち、将来の記事レベル制御の入り口にする。
   */
  static async checkPostPermission(
    userId: string,
    _post: WikiPostDetail,
    permission: Permission
  ): Promise<boolean> {
    return this.checkPermission(userId, permission);
  }
}
