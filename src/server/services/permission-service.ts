import { Permission } from "@/server/types";
import { WikiPostDetail } from "@/types/wiki";

/**
 * 権限チェック。
 *
 * 記事の公開状態は hagaki の `draft` (配信側で遮断される) が担うため、
 * ここでは「誰が何を操作できるか」だけを見る。現状はログイン済みの
 * ユーザー全員が読み書きでき、ロール (管理者など) の区別は無い。
 * 削除のような権限の要る操作を足すときに、ここへ判定を加える。
 */
export class PermissionService {
  /**
   * ユーザーの基本権限をチェック
   */
  static async checkPermission(
    _userId: string,
    permission: Permission
  ): Promise<boolean> {
    switch (permission) {
      case "read":
      case "write":
        return true;
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
