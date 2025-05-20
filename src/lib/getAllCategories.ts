import type { WikiCategory } from "@/types/wiki";

// カテゴリ一覧を取得する関数
export async function getAllCategories(): Promise<WikiCategory[]> {
  const res = await fetch(
    "https://wiki-contentdev.yahiro.workers.dev/categories.json"
  );
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  const categories = (await res.json()) as WikiCategory[];
  return categories;
}
