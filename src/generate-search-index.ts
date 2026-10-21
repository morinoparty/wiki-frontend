import path from "node:path";
import { writeFile } from "node:fs/promises";
import { getHagakiClient } from "./lib/hagaki";
import { getPostBySlug } from "./lib/getPostBySlug";
import { postDate } from "./types/wiki";

export type PostDocument = {
  slug: string;
  title: string;
  date: string;
  tags: string;
  content: string;
};

const baseDir = path.join(process.cwd(), "public");

// 日本語文字列の分かち書き（簡易版）
// TODO: kuromoji.js や TinySegmenter などのライブラリを用いて精度改善
export const tokenizeJapanese = (text: string): string => {
  // この簡易実装では、以下を行います：
  // 1. 英数字と日本語の間に空白を挿入
  // 2. 句読点の後に空白を挿入

  // 英数字と日本語の境界に空白を追加
  let tokenized = text.replace(/([a-zA-Z0-9]+)([ぁ-んァ-ン一-龥])/g, "$1 $2");
  tokenized = tokenized.replace(/([ぁ-んァ-ン一-龥])([a-zA-Z0-9]+)/g, "$1 $2");

  // 句読点の後に空白を追加（。、！？）
  tokenized = tokenized.replace(/([。、！？])/g, "$1 ");

  return tokenized;
};

export const generateSearchIndex = async () => {
  // getAllPosts はネットワークエラーを空配列に丸めるので使わず、失敗を main() まで上げる
  const posts = await getHagakiClient().posts.list({
    sortBy: "updated",
    order: "desc",
  });
  const slugs = posts.map((post) => post.slug);
  const searchIndex: PostDocument[] = [];

  for (const slug of slugs) {
    const fileContent = await getPostBySlug(slug);
    if (!fileContent) continue;

    // Markdownの記法を削除してクリーンなテキストを取得
    const cleanedContent = fileContent.body;

    // 日本語のトークン化
    const tokenizedContent = tokenizeJapanese(cleanedContent);
    const tokenizedTitle = tokenizeJapanese(fileContent.title || "");

    searchIndex.push({
      slug,
      title: tokenizedTitle,
      tags: fileContent.category || "",
      content: tokenizedContent,
      date: postDate(fileContent),
    });
  }

  await writeFile(
    path.join(baseDir, "search-index.json"),
    JSON.stringify(searchIndex)
  );

  // インデックスのファイルサイズ（概算）
  const indexSize = JSON.stringify(searchIndex).length / 1024; // KB単位

  console.log(
    `検索インデックスを生成しました。合計 ${
      searchIndex.length
    } 件の記事をインデックス化しました。（サイズ: 約${indexSize.toFixed(2)}KB）`
  );
};

/**
 * `pnpm run generate:index` (cf build の前) から呼ばれる。
 *
 * 検索 index は配信中の wiki-content から作るので、wiki-content がまだ
 * deploy されていない・落ちているときは取得に失敗する。
 *
 * - 本番 deploy (GitHub Actions の push) では失敗をそのまま build の失敗にする。
 *   検索が黙って空になった版を出さないため
 * - それ以外 (PR の dry-run、ローカル) では空の index を書いて警告だけ出し、
 *   build は続ける
 */
async function main() {
  try {
    await generateSearchIndex();
  } catch (error) {
    const isProductionDeploy =
      process.env.CI === "true" && process.env.GITHUB_EVENT_NAME === "push";
    if (isProductionDeploy) {
      console.error("::error::検索インデックスを生成できませんでした", error);
      process.exit(1);
    }
    console.warn(
      "::warning::検索インデックスを生成できなかったため、空のインデックスを書き出します",
      error
    );
    await writeFile(path.join(baseDir, "search-index.json"), "[]");
  }
}

await main();
