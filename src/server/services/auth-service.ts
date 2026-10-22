import { getSession, type AppSession } from "@/lib/auth";

export type { AppSession };

export class AuthService {
  /**
   * 現在のセッションを取得
   */
  static async getCurrentSession(): Promise<AppSession> {
    return await getSession();
  }
}
