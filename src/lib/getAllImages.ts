import type { WikiImageFile } from "@/types/wiki";

// 画像ファイル名リストを取得する関数
export async function getAllImages(): Promise<WikiImageFile[]> {
  const res = await fetch(
    "https://wiki-contentdev.yahiro.workers.dev/img.json"
  );
  if (!res.ok) {
    throw new Error("Failed to fetch images");
  }
  const images = (await res.json()) as WikiImageFile[];
  return images;
}
