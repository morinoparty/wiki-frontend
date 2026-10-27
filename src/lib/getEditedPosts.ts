import type { ArticleEditor, WikiPost } from "@/types/wiki";
import { getAllPosts } from "./getAllPosts";

/** あるユーザーが編集に関わった記事一件分。 */
export interface EditedPost {
  post: WikiPost;
  /** そのユーザーによる編集回数。 */
  edits: number;
  /** そのユーザーが最後に編集した日時 (ISO 8601)。 */
  lastEditedAt: string;
}

/**
 * 指定したユーザーが編集に関わった記事を、最終編集が新しい順で返す。
 *
 * 判定は生成物 `article.json` の `editors` (履歴のコミッター名から復元した
 * ユーザー ID を畳んだもの) で行う。コミッター名には better-auth の
 * `user.id` が入っているので、セッションの ID をそのまま渡せる。
 *
 * 記事一覧 1 リクエストで完結する。`editors` を持たない古い生成物が
 * 配信されている場合は誰の編集も引けないため、警告だけ出して空を返す。
 */
export async function getPostsEditedBy(
  userId: string
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
      (candidate: ArticleEditor) => candidate.userId === userId
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
