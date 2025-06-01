import type { WikiCategory } from "@/types/wiki";

// カテゴリ一覧を取得する関数
export async function getAllCategories(): Promise<WikiCategory[]> {
  const res = await fetch(
    "https://wiki-contentdev.yahiro.workers.dev/categories.json",
    {
      cache: "force-cache",
    }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  const categories = (await res.json()) as WikiCategory[];
  // hasPositionがtrueのものを上に、falseを下に。hasPositionが同じ場合はslugでa→zソート
  categories.sort((a, b) => {
    if (a.hasPosition !== b.hasPosition) {
      return a.hasPosition ? -1 : 1;
    }
    return a.slug.localeCompare(b.slug);
  });
  return categories;
}
