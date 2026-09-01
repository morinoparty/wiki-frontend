import type {
  CategoryOptionField,
  EditorSummary,
  GetAllPostsOptions as HagakiGetAllPostsOptions,
  WikiCategory as HagakiCategory,
  WikiPost as HagakiPost,
  WikiPostDetail as HagakiPostDetail,
  WikiThumbnail,
} from "hagaki";

export type { CategoryOptionField, WikiThumbnail };

// 記事のメタデータ。hagaki のコンテンツフォーマット
// (content/article/<uuid>/index.mdx) が正で、以下は wiki-frontend の
// ダッシュボード機能だけが使う補助フィールド。
// 公開状態は hagaki 本体の `draft` (frontmatter に永続化される) を使う。
type DashboardMetadata = {
  // 座標情報（カテゴリが option で x / y を integer 宣言している場合に使用）
  x?: number;
  y?: number;
};

/**
 * 記事一件の編集者一人分の集計。wiki-content の生成物
 * (`article.json` の `editors`) が正で、履歴をプレイヤーごとに畳んだもの。
 * `player` は Minecraft UUID で、better-auth の user.id と同じ値。
 */
export type ArticleEditor = EditorSummary;

// 生成物 (article.json) 由来のフィールド。hagaki の WikiPost には無い。
type GeneratedMetadata = {
  editors?: ArticleEditor[];
};

// 投稿データの型定義
export type WikiPost = HagakiPost & DashboardMetadata & GeneratedMetadata;

// 詳細取得時（bodyあり）
export type WikiPostDetail = HagakiPostDetail & DashboardMetadata;

export type GetAllPostsOptions = HagakiGetAllPostsOptions;

export type WikiCategory = HagakiCategory;

/** 記事の表示用日時。生成物が無い記事では空文字。 */
export function postDate(post: Pick<WikiPost, "updated" | "created">): string {
  return post.updated ?? post.created ?? "";
}
