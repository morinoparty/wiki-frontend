import type { AppSession } from "@/lib/auth";
import { contentUserId, type ContentUserFields } from "@/lib/content-user";
import { getHagakiClient } from "@/lib/hagaki";
import { createTtlCache } from "@/lib/ttlCache";
import { normalizeEditorList, type Permission } from "@/server/types";
import type { WikiPostDetail } from "@/types/wiki";

/** 権限判定に使うログインユーザー。セッションから `toPostActor` で作る。 */
export type PostActor = {
  /** better-auth の user.id (このデプロイでは MineAuth の Minecraft UUID) */
  userId: string;
  /** MineAuth の roles (LuckPerms のグループ名)。ログイン時点のスナップショット */
  roles: string[];
};

/** 権限判定に使う記事側の情報。 */
export type PostAccessInfo = {
  /** frontmatter の編集者リスト。空・未設定なら制限なし */
  editor?: string[];
  /** 下書きか */
  draft?: boolean;
  /**
   * 記事の作成者 (最古のコミットのユーザー)。下書きの判定にだけ使う。
   * null はコミッター名からユーザーを特定できなかった場合
   */
  creator?: string | null;
};

/** すべての編集制限を無視できるロール名 (完全一致)。 */
export const STAFF_ROLE = "staff";

/**
 * 作成者の履歴を引くときの 1 ページの件数 (GitHub API の上限)。
 * hagaki 0.3.0 の `posts.history` は 1 ページ目 (新しい順) しか返さないので、
 * この件数ちょうど返ってきたら最古のコミットまで届いていないとみなす。
 */
export const HISTORY_PER_PAGE = 100;

// 記事の作成者 (最古のコミット) は後から変わらないので isolate 内でキャッシュする。
// 特定できなかったとき (null: ユーザー不明・履歴が 1 ページを超える、
// undefined: 履歴が取れない) はキャッシュしない — 作成直後に GitHub の
// commits API が追いついていないだけのことがある
const creatorCache = createTtlCache<string>(60 * 60 * 1000);

/** セッションから権限判定用のユーザーを作る。未ログインなら null。 */
export function toPostActor(session: AppSession): PostActor | null {
  const user = session?.user;
  if (!user?.id) return null;
  const roles = Array.isArray(user.roles)
    ? user.roles.filter((role): role is string => typeof role === "string")
    : [];
  return { userId: user.id.toLowerCase(), roles };
}

/** スタッフ (すべての編集制限を無視できる) か。 */
export function isStaff(actor: PostActor): boolean {
  return actor.roles.includes(STAFF_ROLE);
}

/**
 * 記事を編集 (表示・保存) できるかを判定する純粋関数。I/O はしない。
 *
 * - スタッフは常に可
 * - 下書き: 作成者 ∪ 編集者リスト
 * - 公開記事: 編集者リストが空なら全員、あればリストのプレイヤーだけ
 *
 * 作成者が特定できない (null) 下書きは、編集者リストとスタッフだけが触れる。
 */
export function canEditPost(actor: PostActor, post: PostAccessInfo): boolean {
  if (isStaff(actor)) return true;
  const userId = actor.userId.toLowerCase();
  const editor = normalizeEditorList(post.editor);
  if (post.draft === true) {
    const creator = post.creator?.toLowerCase() ?? null;
    return creator === userId || editor.includes(userId);
  }
  return editor.length === 0 || editor.includes(userId);
}

/**
 * 保存後の編集者リストで、保存したユーザー自身が締め出されるかを判定する純粋関数。
 * リストが空でなく本人を含まない保存は、スタッフ以外には許さない
 * (自分で直せなくなり、スタッフに頼むしかなくなるため)。
 */
export function locksOutSelf(actor: PostActor, editor: string[] | undefined): boolean {
  if (isStaff(actor)) return false;
  const list = normalizeEditorList(editor);
  return list.length > 0 && !list.includes(actor.userId.toLowerCase());
}

/**
 * 権限チェック。
 *
 * 記事の公開状態は hagaki の `draft` (配信側で遮断される) が担い、ここでは
 * 「誰が何を操作できるか」を見る。判定本体は純粋関数 `canEditPost` で、
 * このクラスは作成者の取得 (下書きのときだけ) を担う薄いラッパー。
 */
export class PermissionService {
  /**
   * ユーザーの基本権限 (記事に依らないもの) をチェック。
   * ログイン済みなら誰でも記事を作成・閲覧できる。
   */
  static async checkPermission(
    _actor: PostActor,
    permission: Permission
  ): Promise<boolean> {
    switch (permission) {
      case "read":
      case "write":
        return true;
      default:
        return false;
    }
  }

  /**
   * 記事の作成者 = 記事本体 (`index.mdx`) の最古のコミットのユーザーを返す。
   *
   * - string: 作成者のユーザー ID (better-auth の `user.id`)
   * - null: 作成者を特定できない。最古のコミットにユーザーが無い (古い移行データ
   *   など) か、履歴が 1 ページ (`HISTORY_PER_PAGE` 件) を超えていて最古の
   *   コミットまで取れない場合
   * - undefined: 履歴が 1 件も取れない。作成直後に GitHub の commits API が
   *   追いついていないだけのことが多いが、判定には使えない
   *
   * TODO(hagaki の改名版へ上げたら): 最古のコミットは `posts.firstCommit(uuid)` で
   * 取れるようになる (履歴の長さによらず API 2 回)。そのときは `posts.history` +
   * `creatorFromHistory` をやめて `firstCommit` の `userId` を使い、
   * 「履歴が 1 ページを超えると作成者不明」の制限をなくす。
   * hagaki 0.3.0 には `firstCommit` が無いので、今は 1 ページ分の履歴で判定している
   */
  static async getPostCreator(uuid: string): Promise<string | null | undefined> {
    const cached = creatorCache.get(uuid);
    if (cached) return cached;
    const commits = await getHagakiClient().posts.history(uuid, {
      perPage: HISTORY_PER_PAGE,
    });
    if (commits.length === 0) return undefined;
    const creator = creatorFromHistory(commits);
    if (creator) creatorCache.set(uuid, creator);
    return creator;
  }

  /**
   * 作成した記事の作成者をキャッシュに入れておく。作成直後は GitHub の
   * commits API に新しいコミットがまだ出ないことがあり、そのあいだに作成者本人が
   * 自分の下書きを開けなくなるのを防ぐ (同じ isolate の間だけ効く)。
   */
  static rememberPostCreator(uuid: string, userId: string): void {
    creatorCache.set(uuid, userId.toLowerCase());
  }

  /**
   * 特定の記事に対する権限をチェック。作成者は下書きのときだけ取得する
   * (公開記事の判定には不要で、GitHub API を 1 回節約できる)。
   *
   * 保存後の状態 (`draft` / `editor` を差し替えたもの) を渡せば、
   * 「保存したあとも本人が触れるか」の判定にも使える。
   */
  static async checkPostPermission(
    actor: PostActor,
    post: Pick<WikiPostDetail, "uuid" | "draft" | "editor">,
    permission: Permission
  ): Promise<boolean> {
    if (!(await this.checkPermission(actor, permission))) return false;
    // スタッフは履歴を引くまでもなく可
    if (isStaff(actor)) return true;
    if (post.draft !== true) {
      return canEditPost(actor, { editor: post.editor, draft: post.draft });
    }
    // 編集者リストだけで決まるなら履歴を引かない
    if (canEditPost(actor, { editor: post.editor, draft: true, creator: null })) {
      return true;
    }
    const creator = await this.getPostCreator(post.uuid);
    if (creator === undefined) {
      // 履歴が取れないときは作成者が分からないので、編集者リストとスタッフだけに絞る
      // (fail closed)。wiki-content は公開リポジトリで、下書きの uuid も誰でも
      // 見られるため「uuid を知っている = 作成者」とはみなせない。作成者本人の
      // 作成直後は createPost の rememberPostCreator で通る (同じ isolate の間)
      console.warn(`記事 ${post.uuid} の履歴が取れないため、作成者を特定できませんでした`);
    }
    return canEditPost(actor, {
      editor: post.editor,
      draft: post.draft,
      creator: creator ?? null,
    });
  }
}

/**
 * 新しい順のコミット一覧 (`perPage` 件を上限に 1 ページだけ取ったもの) から
 * 作成者 (最古のコミットのユーザー) を取り出す純粋関数。
 *
 * 最古のコミットのユーザーを特定できない場合は null。一覧が 1 ページ分
 * ちょうどある場合も、最古のコミットまで届いていない可能性があるので null
 * (途中のコミットの人を作成者にすると、本来の作成者が締め出されるため)。
 */
export function creatorFromHistory(
  commits: ReadonlyArray<ContentUserFields>,
  perPage: number = HISTORY_PER_PAGE
): string | null {
  if (commits.length >= perPage) return null;
  const oldest = commits.at(-1);
  if (!oldest) return null;
  return contentUserId(oldest)?.toLowerCase() ?? null;
}
