import fs from "fs";
import path from "path";

// 投稿データの型定義
export type WikiPost = {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  body: string;
  image?: string;
};

export type GetAllPostsOptions = {
  sortBy?: "date" | "title";
  order?: "asc" | "desc";
};

// assets/content/wiki ディレクトリ内の全JSONファイルをまとめて取得する関数
export async function getAllPosts(
  options?: GetAllPostsOptions
): Promise<WikiPost[]> {
  const dirPath = path.join(process.cwd(), "assets/content/wiki");
  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".json"));
  const posts = files.map((file) => {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as WikiPost;
  });

  if (options?.sortBy) {
    const { sortBy, order = "desc" } = options;
    posts.sort((a, b) => {
      if (sortBy === "date") {
        // ISO8601日付文字列の比較
        return order === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "title") {
        return order === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      return 0;
    });
  }

  return posts;
}
