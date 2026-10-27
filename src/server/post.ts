import { createServerFn } from "@tanstack/react-start";
import { summarizeEditors } from "@morinoparty/hagaki";
import { getArticleInfo } from "@/lib/getArticleInfo";
import { getPlayerNames } from "@/lib/getPlayerName";
import { getPostBySlug } from "@/lib/getPostBySlug";

/** 記事末尾に出す編集者一人分。プレイヤー名は解決済み。 */
export interface PostContributor {
  /** better-auth の user.id。このデプロイ (MineAuth) では Minecraft UUID */
  userId: string;
  /** `userId` から解決した Minecraft のプレイヤー名。解決できなければ `userId` */
  playerName: string;
  edits: number;
  lastEditedAt: string;
}

/** 記事ページの編集者と日時。`info.json` が無い記事では null。 */
export interface PostContributorsData {
  contributors: PostContributor[];
  created: string | null;
  updated: string | null;
}

/**
 * 記事ページ (`/$postId`) に必要なものをまとめて返す。記事が無ければ null。
 *
 * 編集者は生成物 `info.json` の履歴 (移行前の `modified` + git のコミット) から
 * 集計する。コミッター名が `"<name> (<id>)"` 形式でないものは
 * ユーザーを特定できないため一覧には出ない。
 */
export const fetchPostPage = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const post = await getPostBySlug(slug);
    if (!post) return null;

    const info = await getArticleInfo(post.uuid);
    let contributors: PostContributorsData | null = null;
    if (info) {
      const summaries = summarizeEditors(info.history);
      const names = await getPlayerNames(summaries.map((s) => s.userId));
      contributors = {
        contributors: summaries.map((s) => ({
          userId: s.userId,
          playerName: names.get(s.userId) ?? s.userId,
          edits: s.edits,
          lastEditedAt: s.lastEditedAt,
        })),
        created: info.created,
        updated: info.updated,
      };
    }

    return { post, contributors };
  });
