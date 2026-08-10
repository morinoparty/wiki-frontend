import type { ArticleEditor, WikiPost } from "@/types/wiki";
import { getAllPosts } from "./getAllPosts";

/** あるプレイヤーが編集に関わった記事一件分。 */
export interface EditedPost {
  post: WikiPost;
  /** そのプレイヤーによる編集回数。 */
  edits: number;
  /** そのプレイヤーが最後に編集した日時 (ISO 8601)。 */
  lastEditedAt: string;
}

/**
 * 指定したプレイヤーが編集に関わった記事を、最終編集が新しい順で返す。
 *
 * 判定は生成物 `article.json` の `editors` (履歴のコミッター名から復元した
 * UUID を畳んだもの) で行う。better-auth の `user.id` は Minecraft UUID
 * そのものなので、セッションの ID をそのまま渡せる。
 *
 * 記事一覧 1 リクエストで完結する。`editors` を持たない古い生成物が
 * 配信されている場合は誰の編集も引けないため、警告だけ出して空を返す。
 */
export async function getPostsEditedBy(
  playerId: string
): Promise<EditedPost[]> {
  const posts = await getAllPosts();

  if (posts.length > 0 && posts.every((post) => post.editors === undefined)) {
    console.warn(
      "article.json に editors がありません。wiki-content の再生成・デプロイが必要です"
    );
    return [];
  }

  const edited: EditedPost[] = [];
  for (const post of posts) {
    const editor = post.editors?.find(
      (candidate: ArticleEditor) => candidate.player === playerId
    );
    if (!editor) continue;
    edited.push({
      post,
      edits: editor.edits,
      lastEditedAt: editor.lastEditedAt,
    });
  }

  return edited.sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt));
}
