import type { WikiCategory } from "@/types/wiki";
import { getHagakiClient } from "./hagaki";

/**
 * カテゴリ一覧 (`/categories.json`) を取得する。
 * hagaki 側で slug 昇順にソート済み。
 */
export async function getAllCategories(): Promise<WikiCategory[]> {
  return getHagakiClient().categories.list();
}
