import { createServerFn } from "@tanstack/react-start";
import { getSession } from "@/lib/auth";
import {
  getDashboardPosts,
  getDashboardPostsEditedBy,
  type DashboardEditedPost,
  type DashboardPost,
} from "@/lib/getDashboardPosts";

/** ダッシュボードの記事一覧 (draft / デプロイ待ちを含む)。 */
export const fetchDashboardPosts = createServerFn({ method: "GET" }).handler(
  (): Promise<DashboardPost[]> => getDashboardPosts()
);

/** ログイン中のプレイヤーが編集に関わった記事。未ログインなら null。 */
export const fetchMyEditedPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardEditedPost[] | null> => {
    const session = await getSession();
    const playerId = session?.user?.id;
    if (!playerId) return null;
    return getDashboardPostsEditedBy(playerId);
  }
);
