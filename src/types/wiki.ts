// 投稿データの型定義
export type WikiPost = {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  image?: string;
};

// 詳細取得時（bodyあり）
export type WikiPostDetail = WikiPost & {
  body: string;
};

export type GetAllPostsOptions = {
  sortBy?: "date" | "title";
  order?: "asc" | "desc";
};

export type WikiCategory = {
  title: string;
  slug: string;
  body: string;
};

// 画像ファイル名リストの型定義
export type WikiImageFile = string;
