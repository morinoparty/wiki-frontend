import "server-only";

import { getAllPosts } from "@/lib/getAllPosts";
import { getHagakiClient } from "@/lib/hagaki";
import { getSession } from "@/lib/auth";
import type { WikiPost } from "@/types/wiki";

/**
 * ダッシュボード一覧の 1 行。CDN の manifest に無い記事
 * (draft / デプロイ待ち) はリポジトリから補完する。
 */
export type DashboardPost = WikiPost & {
  /** 下書き。配信されない (frontmatter の draft: true)。 */
  draft?: boolean;
  /** リポジトリにはあるが CDN の manifest にまだ無い (デプロイ待ち)。 */
  unpublished?: boolean;
};

/**
 * ダッシュボードの記事一覧。公開記事は CDN の article.json、draft と
 * デプロイ待ちの記事はリポジトリ (git tree 1 コール + 差分だけ個別取得)。
 *
 * リポジトリ側の補完は認証済みセッションのときだけ行う — draft の
 * タイトル等を未認証の閲覧者に出さないため。
 */
export async function getDashboardPosts(): Promise<DashboardPost[]> {
  const published = await getAllPosts();

  const session = await getSession();
  if (!session?.user?.id) return published;

  // CDN 障害時 (getAllPosts は空配列を返す) に全記事を GitHub API から
  // 個別取得してしまわないよう、公開分が読めないときは補完もしない。
  if (published.length === 0) return published;

  try {
    const client = getHagakiClient();
    const publishedUuids = new Set(published.map((post) => post.uuid));
    const repoUuids = await client.posts.listUuidsInRepo();
    const missing = repoUuids.filter((uuid) => !publishedUuids.has(uuid));
    if (missing.length === 0) return published;

    const repoPosts = await Promise.all(
      missing.map((uuid) => client.posts.getFromRepo(uuid))
    );
    const extras: DashboardPost[] = [];
    for (const post of repoPosts) {
      if (!post) continue;
      // 一覧に本文は不要。body を落として WikiPost 相当にする。
      const { body, ...meta } = post;
      void body;
      extras.push({
        ...meta,
        draft: post.draft,
        unpublished: !post.draft,
      });
    }
    // 未配信分を先頭に (作業中のものほど上に見えてほしい)。
    return [...extras, ...published];
  } catch (error) {
    // リポジトリ側の補完は壊れても一覧自体は出す。
    console.warn("Failed to merge repository-only posts:", error);
    return published;
  }
}
