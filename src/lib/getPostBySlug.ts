import fs from "fs";
import path from "path";
import { WikiPost } from "./getAllPosts";

/**
 * 指定したslugに一致するWiki投稿データを取得する関数
 * @param slug 投稿のslug
 * @returns WikiPost | null
 */
export async function getPostBySlug(slug: string): Promise<WikiPost | null> {
  const dirPath = path.join(process.cwd(), "assets/content/wiki");
  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".json"));
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const post = JSON.parse(content) as WikiPost;
    if (post.slug === slug) {
      return post;
    }
  }
  return null;
}
