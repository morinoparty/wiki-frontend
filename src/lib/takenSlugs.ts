import { toUrlSlug } from "@morinoparty/hagaki";
import { getAllPosts } from "@/lib/getAllPosts";
import { getRepoOnlyPosts } from "@/lib/getDashboardPosts";

/** 使用中の slug 1 件。slug は `normalizeSlug` 済み。 */
export type TakenSlug = {
  slug: string;
  uuid: string;
};

/**
 * slug を比較用の形 (`toUrlSlug` = percent-encode 済み) にそろえる。
 *
 * `article.json` の slug は生成時に `toUrlSlug` 済みで、リポジトリの frontmatter や
 * 入力欄の slug は生のまま。`toUrlSlug` は最後に `encodeURIComponent` するので、
 * エンコード済みの値にそのままかけると `%25..` に二重エンコードされる。
 * いったんデコードしてからかけることで、どちらから来ても同じ値になる。
 */
export function normalizeSlug(slug: string): string {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // `%` を含む生の slug などはそのまま使う (入力の regex で通常は弾かれる)
  }
  return toUrlSlug(decoded);
}

/**
 * slug を使っている記事の uuid を返す。`excludeUuid` (更新中の記事自身) は除く。
 * 誰も使っていなければ null。
 */
export function findSlugOwner(
  taken: readonly TakenSlug[],
  slug: string,
  excludeUuid?: string
): string | null {
  const normalized = normalizeSlug(slug);
  const owner = taken.find(
    (entry) => entry.slug === normalized && entry.uuid !== excludeUuid
  );
  return owner?.uuid ?? null;
}

/**
 * 使用中の slug をすべて返す (サーバー専用)。
 *
 * 公開記事 (CDN の `article.json`) と、リポジトリにしか無い記事 (下書き・デプロイ待ち)
 * の和集合。下書きは `slug-index.json` に載らないので、CDN だけを見ると他人の
 * 下書きと同じ slug を選べてしまい、その下書きを公開した時点で `hagaki generate` が
 * 落ちてコンテンツのデプロイ全体が止まる。ここで両方を数えてそれを防ぐ。
 *
 * 権限によるフィルタはしない (見えない下書きの slug も「使用中」に数える)。
 * 返すのは slug と uuid だけで、タイトルなどは含めない。
 *
 * 公開記事の一覧が取れないとき (CDN 障害で空) や、リポジトリにしか無い記事を
 * 1 件でも読めなかったときは、重複を確認できないので例外を投げる (fail closed)。
 * 欠けた集合のまま進めると重複を見逃す。
 *
 * リポジトリにしか無い記事の中身は uuid ごとに短時間キャッシュする
 * (`getRepoOnlyPosts` の `useCache`)。別の isolate で直前に slug を変えた下書きは、
 * キャッシュが切れるまで古い slug で数えられることがある。
 */
export async function getTakenSlugs(): Promise<TakenSlug[]> {
  const published = await getAllPosts();
  if (published.length === 0) {
    throw new Error(
      "公開記事の一覧を取得できないため、スラッグの重複を確認できません。時間をおいて再度お試しください"
    );
  }
  // strict: 下書きを 1 件でも読めなければ例外 (黙って欠けた集合で重複を見逃さない)。
  // useCache: 保存のたびに下書きの数だけ GitHub API を叩かない (uuid の一覧は毎回取る)
  const repoOnly = await getRepoOnlyPosts(published, {
    strict: true,
    useCache: true,
  });
  return [...published, ...repoOnly].map((post) => ({
    slug: normalizeSlug(post.slug),
    uuid: post.uuid,
  }));
}
