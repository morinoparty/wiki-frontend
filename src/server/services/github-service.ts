import type { CommitFile, Committer } from "@morinoparty/hagaki";
import { committerFromBetterAuth } from "@morinoparty/hagaki/auth/better-auth";
import { getHagakiClient } from "@/lib/hagaki";
import { WikiPostDetail } from "@/types/wiki";
import type { AppSession } from "@/lib/auth";
import { assertOwnedAssetPath, PostImageError } from "./post-images";

/**
 * GitHub 上の wiki コンテンツを読み書きするサービス。
 *
 * コンテンツは hagaki のフォーマット。記事は
 * `content/article/<uuid>/index.mdx`、画像は同ディレクトリの
 * `assets/<imageId>.avif` に置かれ、パスは常に uuid ベースで解決する
 * (slug は変わりうるため)。
 *
 * 読み書きはすべて hagaki クライアント経由 (posts.* / files.* / commits.*)。
 * 配信済みの内容は CDN、編集中の内容はリポジトリから読む。
 */
export class GitHubService {
  /**
   * slug から uuid を解決する。配信中の `slug-index.json` を引く hagaki の
   * `posts.getBySlug` に委譲するため、まだ配信されていない記事は解決できない。
   */
  private static async resolveUuid(slug: string): Promise<string | null> {
    const post = await getHagakiClient().posts.getBySlug(slug);
    return post?.uuid ?? null;
  }

  /**
   * コミッター情報を生成
   *
   * hagaki の `committerFromBetterAuth` は既定の nameFormat が `"<name> (<id>)"`
   * を生成するため、従来の手組みと同一の結果になる。
   * MineAuth が返す `email` は noreply アドレスで commit には使いたくないうえ、
   * 空文字が入ると `email ?? defaultEmail` の nullish 判定をすり抜けるため、
   * email は明示的に null にして常に `players@morino.party` を使わせる。
   * name / id が揃わない場合は undefined を返し、GitHub にトークン所有者を使わせる。
   */
  private static getCommitter(session: AppSession): Committer | undefined {
    if (!session?.user?.name || !session?.user?.id) {
      return undefined;
    }
    return committerFromBetterAuth(
      {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: null,
        },
      },
      { defaultEmail: "players@morino.party" },
    );
  }

  /** 記事の存在を uuid で確認する。 */
  static async checkPostExistsByUuid(uuid: string): Promise<boolean> {
    return getHagakiClient().posts.existsInRepo(uuid);
  }

  /** uuid 指定で GitHub 上の記事 (未配信の変更を含む) を取得する。 */
  static async getPostByUuid(uuid: string): Promise<WikiPostDetail | null> {
    return getHagakiClient().posts.getFromRepo(uuid);
  }

  /**
   * 新しい記事を作成
   */
  static async createPost(
    post: WikiPostDetail,
    commitMessage: string,
    session: AppSession,
  ): Promise<{ success: boolean; error?: string; commitId?: string; uuid?: string }> {
    try {
      const uuid = post.uuid || crypto.randomUUID();
      const result = await getHagakiClient().posts.save(
        { ...post, uuid },
        {
          committer: this.getCommitter(session),
          commitMessage,
        },
      );

      return {
        success: true,
        commitId: result.commitSha,
        uuid,
      };
    } catch (error) {
      console.error("GitHub API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "GitHub API エラー",
      };
    }
  }

  /**
   * 記事を更新
   */
  static async updatePost(
    post: WikiPostDetail,
    commitMessage: string,
    session: AppSession,
    images?: {
      /** 本文が参照する未コミット画像 (post-images の readImageUploads で検証済み)。 */
      files?: CommitFile[];
      /** 本文から消えた画像のリポジトリパス。同じコミットで削除する。 */
      deletePaths?: string[];
    },
  ): Promise<{ success: boolean; error?: string; commitId?: string }> {
    try {
      if (!post.uuid) {
        return { success: false, error: "記事の uuid がありません" };
      }
      // posts.save は対象が無くても新規作成してしまうため、
      // 「更新」の意味を保つよう事前に存在確認する
      if (!(await this.checkPostExistsByUuid(post.uuid))) {
        return { success: false, error: "ファイルが見つかりません" };
      }

      // 画像は記事本文と同じコミットに載せる。別コミットにすると、
      // エディタで消した画像の孤児コミットが履歴に残り、revert も噛み合わない。
      const files = images?.files ?? [];
      const deletePaths = images?.deletePaths ?? [];
      for (const path of deletePaths) assertOwnedAssetPath(path, post.uuid);

      const result = await getHagakiClient().posts.save(post, {
        committer: this.getCommitter(session),
        commitMessage,
        files,
        deletePaths,
      });

      return {
        success: true,
        commitId: result.commitSha,
      };
    } catch (error) {
      if (error instanceof PostImageError) {
        return { success: false, error: error.message };
      }
      console.error("GitHub API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "GitHub API エラー",
      };
    }
  }

  /**
   * 記事の履歴を取得
   */
  static async getPostHistory(slug: string): Promise<{
    success: boolean;
    error?: string;
    data?: Array<{
      commitId: string;
      version: number;
      message: string;
      author: string;
      date: string;
      changes: string[];
    }>;
  }> {
    try {
      const uuid = await this.resolveUuid(slug);
      if (!uuid) {
        return { success: false, error: "記事が見つかりません" };
      }

      // 記事本体のコミット履歴を取得
      const commits = await getHagakiClient().posts.history(uuid, {
        perPage: 50,
      });

      const history = commits.map((commit, index) => ({
        commitId: commit.sha,
        version: commits.length - index, // 新しいものほど大きいバージョン番号
        message: commit.message,
        author: commit.author,
        date: commit.date || new Date().toISOString(),
        changes: [], // TODO: 変更内容の詳細を取得
      }));

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      console.error("GitHub API error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "履歴の取得に失敗しました",
      };
    }
  }

  /**
   * 記事の差分を取得
   */
  static async getPostDiff(
    slug: string,
    fromCommit: string,
    toCommit: string,
  ): Promise<{ success: boolean; error?: string; data?: string }> {
    try {
      const uuid = await this.resolveUuid(slug);
      if (!uuid) {
        return { success: false, error: "記事が見つかりません" };
      }
      // コミット間の記事本体の差分を取得
      const patch = await getHagakiClient().posts.diff(
        uuid,
        fromCommit,
        toCommit,
      );

      if (patch === null) {
        return { success: false, error: "差分が見つかりません" };
      }

      return {
        success: true,
        data: patch,
      };
    } catch (error) {
      console.error("GitHub API error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "差分の取得に失敗しました",
      };
    }
  }
}
