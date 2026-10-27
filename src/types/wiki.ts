import type {
  CategoryOptionEnumValue,
  CategoryOptionField,
  PostOptionValues,
  GetAllPostsOptions as HagakiGetAllPostsOptions,
  WikiCategory as HagakiCategory,
  WikiPost as HagakiPost,
  WikiPostDetail as HagakiPostDetail,
  WikiThumbnail,
} from "@morinoparty/hagaki";
import type { ContentEditorSummary } from "@/lib/content-user";

export type {
  CategoryOptionEnumValue,
  CategoryOptionField,
  PostOptionValues,
  WikiThumbnail,
};

/**
 * 記事一件の編集者一人分の集計。wiki-content の生成物
 * (`article.json` の `editors`) が正で、履歴をユーザーごとに畳んだもの。
 * ユーザーの ID は better-auth の `session.user.id` と同じ値。
 * 生成物の移行前は `player`、移行後は `userId` に入るので、
 * 読むときは必ず `contentUserId` (`@/lib/content-user`) を通す。
 */
export type ArticleEditor = ContentEditorSummary;

// 生成物 (article.json) 由来のフィールド。hagaki の WikiPost には無い。
type GeneratedMetadata = {
  editors?: ArticleEditor[];
};

// 投稿データの型定義。カテゴリ固有の値 (enum の選択など) は hagaki 側の
// `option` (frontmatter の `option.<key>`) に入る
export type WikiPost = HagakiPost & GeneratedMetadata;

// 詳細取得時（bodyあり）。
// `editor` は frontmatter の編集者リスト (better-auth の user.id の配列)。空・未設定なら
// ログイン済みの全員が編集できる。インストール済みの hagaki 0.3.0 の
// WikiPostDetail にはまだ無いので、ここで足している。hagaki 側で読み書き
// (parsePostMarkdown / posts.save) に対応した版へ上げたら、この拡張は消してよい。
// それまでは hagaki が frontmatter の editor を読まず、保存時にも書き出さない
export type WikiPostDetail = HagakiPostDetail & { editor?: string[] };

/**
 * frontmatter の `editor` (編集者リスト) を保存・読み出しできるか。
 *
 * インストール済みの hagaki 0.3.0 は `editor` を読まず、保存時にも書き出さない。
 * この間に入力欄を出すと「制限したつもりで誰でも編集できる」状態になるため、
 * false の間はエディタの入力欄を出さず、サーバーも空でない編集者リストの保存を断る。
 * hagaki を `editor` に対応した版へ上げたら、上の `WikiPostDetail` の拡張と
 * 一緒にこの定数を消す (true にする) こと。
 */
export const EDITOR_LIST_PERSISTED = false;

export type GetAllPostsOptions = HagakiGetAllPostsOptions;

export type WikiCategory = HagakiCategory;

/** 記事の表示用日時。生成物が無い記事では空文字。 */
export function postDate(post: Pick<WikiPost, "updated" | "created">): string {
  return post.updated ?? post.created ?? "";
}
