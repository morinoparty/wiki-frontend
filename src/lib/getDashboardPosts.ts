import { getAllPosts } from "@/lib/getAllPosts";
import { getPostsEditedBy, type EditedPost } from "@/lib/getEditedPosts";
import { getHagakiClient } from "@/lib/hagaki";
import { getSession } from "@/lib/auth";
import { createTtlCache } from "@/lib/ttlCache";
import {
  canEditPost,
  creatorFromHistory,
  HISTORY_PER_PAGE,
  isStaff,
  PermissionService,
  toPostActor,
  type PostActor,
} from "@/server/services/permission-service";
import type { WikiPost, WikiPostDetail } from "@/types/wiki";

/**
 * ダッシュボード一覧の 1 行。CDN の manifest に無い記事
 * (draft / デプロイ待ち) はリポジトリから補完する。
 */
export type DashboardPost = WikiPost & {
  /** 下書き。配信されない (frontmatter の draft: true)。 */
  draft?: boolean;
  /** リポジトリにはあるが CDN の manifest にまだ無い (デプロイ待ち)。 */
  unpublished?: boolean;
};

/** 編集した記事一覧の 1 行。draft / デプロイ待ちの記事も含む。 */
export type DashboardEditedPost = Omit<EditedPost, "post"> & {
  post: DashboardPost;
};

/** リポジトリにしか無い記事 1 件。権限判定のために編集者リストも持つ。 */
export type RepoOnlyPost = DashboardPost & {
  /** frontmatter の編集者リスト (hagaki が対応するまでは常に未設定) */
  editor?: string[];
};

/**
 * リポジトリにしか無い記事のメタデータを uuid ごとに置く isolate 内キャッシュ
 * (slug の重複チェック用)。保存のたびに下書きの数だけ GitHub API を叩かないためのもの。
 *
 * uuid の一覧 (git tree) は毎回取り直すので、新しくできた下書きは必ず読む。
 * 古くなりうるのは「別の isolate で TTL 内に slug を変えた下書き」だけで、
 * 同じ isolate での保存は `rememberRepoOnlyPost` ですぐ反映する。
 */
const REPO_ONLY_CACHE_TTL_MS = 60 * 1000;
const repoOnlyCache = createTtlCache<RepoOnlyPost>(REPO_ONLY_CACHE_TTL_MS);

/** `getRepoOnlyPosts` のオプション。 */
export type GetRepoOnlyPostsOptions = {
  /**
   * 1 件でも読めなかったら例外を投げる。uuid は git tree に `index.mdx` がある
   * ものだけなので、読めない = 取得の失敗 (レート制限・5xx など)。重複チェックで
   * 黙って欠けると他人の下書きと同じ slug を通してしまうので、そこでは true にする
   */
  strict?: boolean;
  /** uuid ごとのキャッシュ (`REPO_ONLY_CACHE_TTL_MS`) を使う */
  useCache?: boolean;
};

/** リポジトリから読んだ記事を一覧の行 (本文なし) にする。 */
function toRepoOnlyPost(post: WikiPostDetail): RepoOnlyPost {
  // 一覧に本文は不要。body を落として WikiPost 相当にする。
  const { body, ...meta } = post;
  void body;
  return {
    ...meta,
    draft: post.draft,
    unpublished: !post.draft,
  };
}

/**
 * 保存した記事を repo-only のキャッシュに入れる。同じ isolate の slug 重複チェックが
 * TTL を待たずに新しい slug を見るようにする (公開済みの記事は使われないだけで害はない)。
 */
export function rememberRepoOnlyPost(post: WikiPostDetail): void {
  repoOnlyCache.set(post.uuid, toRepoOnlyPost(post));
}

/**
 * CDN の manifest に無い記事 (draft / デプロイ待ち) をリポジトリから読む
 * (git tree 1 コール + 差分だけ個別取得)。
 *
 * 権限によるフィルタはしない。呼び出し側で `filterVisibleRepoOnly` などを通すこと
 * (slug の重複チェックでは、見えない draft の slug も数える必要がある)。
 */
export async function getRepoOnlyPosts(
  published: WikiPost[],
  options: GetRepoOnlyPostsOptions = {}
): Promise<RepoOnlyPost[]> {
  const client = getHagakiClient();
  const publishedUuids = new Set(published.map((post) => post.uuid));
  const repoUuids = await client.posts.listUuidsInRepo();
  const missing = repoUuids.filter((uuid) => !publishedUuids.has(uuid));
  if (missing.length === 0) return [];

  const extras: (RepoOnlyPost | null)[] = await Promise.all(
    missing.map(async (uuid) => {
      const cached = options.useCache ? repoOnlyCache.get(uuid) : undefined;
      if (cached) return cached;
      const post: WikiPostDetail | null = await client.posts.getFromRepo(uuid);
      if (!post) return null;
      const extra = toRepoOnlyPost(post);
      repoOnlyCache.set(uuid, extra);
      return extra;
    })
  );
  const loaded = extras.filter((post) => post !== null);
  if (options.strict && loaded.length !== missing.length) {
    // hagaki の getFromRepo は取得エラーも null にするので、件数で検知する
    throw new Error(
      "リポジトリの記事を一部読み込めなかったため、スラッグの重複を確認できません。時間をおいて再度お試しください"
    );
  }
  return loaded;
}

/** 一覧の行から権限判定用のフィールドを落とす (クライアントへ渡さない)。 */
function toDashboardPost({ editor, ...post }: RepoOnlyPost): DashboardPost {
  void editor;
  return post;
}

/**
 * リポジトリにしか無い記事のうち、ユーザーが触れるものだけを返す。
 * 他人の下書きはタイトルごと一覧から隠す。デプロイ待ちの公開記事は
 * 公開ページと同じく誰にでも見えるので残す (編集できるかは編集ページで判定する)。
 */
async function filterVisibleRepoOnly(
  actor: PostActor,
  posts: RepoOnlyPost[]
): Promise<DashboardPost[]> {
  const visible = await Promise.all(
    posts.map(async (post) => {
      if (post.draft !== true || isStaff(actor)) return true;
      // 作成者 (最古のコミット) を引く前に、編集者リストだけで決まるなら引かない
      if (canEditPost(actor, { editor: post.editor, draft: true, creator: null })) {
        return true;
      }
      const creator = await PermissionService.getPostCreator(post.uuid);
      // 履歴がまだ取れない (作成直後) 下書きは一覧に出さない。数秒で出るようになる
      if (creator === undefined) return false;
      return canEditPost(actor, { editor: post.editor, draft: true, creator });
    })
  );
  return posts.filter((_, index) => visible[index]).map(toDashboardPost);
}

/**
 * ダッシュボードの記事一覧。公開記事は CDN の article.json、draft と
 * デプロイ待ちの記事はリポジトリから補完する。
 *
 * リポジトリ側の補完は認証済みセッションのときだけ行い、下書きは
 * 触れる人 (作成者・編集者リスト・スタッフ) にだけ出す — draft の
 * タイトル等を関係ない閲覧者に出さないため。
 */
export async function getDashboardPosts(): Promise<DashboardPost[]> {
  const published = await getAllPosts();

  const actor = toPostActor(await getSession());
  if (!actor) return published;

  // CDN 障害時 (getAllPosts は空配列を返す) に全記事を GitHub API から
  // 個別取得してしまわないよう、公開分が読めないときは補完もしない。
  if (published.length === 0) return published;

  try {
    // 未配信分を先頭に (作業中のものほど上に見えてほしい)。
    const repoOnly = await getRepoOnlyPosts(published);
    return [...(await filterVisibleRepoOnly(actor, repoOnly)), ...published];
  } catch (error) {
    // リポジトリ側の補完は壊れても一覧自体は出す。
    console.warn("Failed to merge repository-only posts:", error);
    return published;
  }
}

/**
 * ユーザーが編集に関わった記事を、最終編集が新しい順で返す。
 *
 * 公開記事は article.json の `editors` で判定する (getPostsEditedBy)。
 * draft / デプロイ待ちの記事は manifest に無いため、リポジトリの
 * コミット履歴 (`PathCommit.userId`) から判定する。
 * 触れなくなった下書き (編集者リストから外された・自分が作成者でない) は出さない。
 */
export async function getDashboardPostsEditedBy(
  actor: PostActor
): Promise<DashboardEditedPost[]> {
  const userId = actor.userId;
  const [published, editedPublished] = await Promise.all([
    getAllPosts(),
    getPostsEditedBy(userId),
  ]);
  // getDashboardPosts と同じく、CDN が読めないときは補完しない。
  if (published.length === 0) return editedPublished;

  try {
    const client = getHagakiClient();
    const repoOnly = await getRepoOnlyPosts(published);
    const editedRepoOnly = await Promise.all(
      repoOnly.map(async (post): Promise<DashboardEditedPost | null> => {
        const commits = await client.posts.history(post.uuid, {
          perPage: HISTORY_PER_PAGE,
        });
        const mine = commits.filter(
          (commit) => commit.userId?.toLowerCase() === userId
        );
        if (mine.length === 0) return null;
        // 作成者は下書きの判定にだけ要る。取得済みの履歴が 1 ページに収まって
        // いればそこから決め (history を二度引かない)、収まらなければ
        // posts.firstCommit で最古のコミットを引く
        let creator: string | null | undefined = null;
        if (post.draft === true) {
          creator =
            commits.length < HISTORY_PER_PAGE
              ? creatorFromHistory(commits)
              : await PermissionService.getPostCreator(post.uuid);
        }
        const allowed = canEditPost(actor, {
          editor: post.editor,
          draft: post.draft,
          creator: creator ?? null,
        });
        if (post.draft === true && !allowed) return null;
        return {
          post: toDashboardPost(post),
          edits: mine.length,
          // history は新しい順
          lastEditedAt: mine[0].date,
        };
      })
    );
    return [
      ...editedRepoOnly.filter((post) => post !== null),
      ...editedPublished,
    ].sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt));
  } catch (error) {
    console.warn("Failed to merge repository-only edited posts:", error);
    return editedPublished;
  }
}
