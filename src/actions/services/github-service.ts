import type { Committer } from "hagaki";
import { committerFromBetterAuth } from "hagaki/auth/better-auth";
import { getHagakiClient, WIKI_REPO } from "@/lib/hagaki";
import { WikiPostDetail } from "@/types/wiki";
import type { AppSession } from "@/lib/auth";
import { randomUUID } from "crypto";
import { ImageValidationError, validateAvifUpload } from "hagaki/image";

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
  /** 記事に属する画像のパス。 */
  private static getAssetPath(uuid: string, imageId: string): string {
    return `${WIKI_REPO.contentPath}/${uuid}/assets/${imageId}.avif`;
  }

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

  /**
   * 記事の存在をチェック
   */
  static async checkPostExists(slug: string): Promise<boolean> {
    const uuid = await this.resolveUuid(slug);
    if (!uuid) return false;
    return this.checkPostExistsByUuid(uuid);
  }

  /** uuid 指定で GitHub 上の記事 (未配信の変更を含む) を取得する。 */
  static async getPostByUuid(uuid: string): Promise<WikiPostDetail | null> {
    return getHagakiClient().posts.getFromRepo(uuid);
  }

  /**
   * 記事を取得
   */
  static async getPost(slug: string): Promise<WikiPostDetail | null> {
    const uuid = await this.resolveUuid(slug);
    if (!uuid) return null;
    return this.getPostByUuid(uuid);
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
      const uuid = post.uuid || randomUUID();
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

      const result = await getHagakiClient().posts.save(post, {
        committer: this.getCommitter(session),
        commitMessage,
      });

      return {
        success: true,
        commitId: result.commitSha,
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
   * 記事を削除 (記事ディレクトリごと)
   */
  static async deletePost(
    slug: string,
    commitMessage: string,
    session: AppSession,
  ): Promise<{ success: boolean; error?: string; commitId?: string }> {
    try {
      const uuid = await this.resolveUuid(slug);
      if (!uuid) {
        return { success: false, error: "ファイルが見つかりません" };
      }

      // 存在しないパスを deletePaths に積むと createTree が 422 で失敗するため、
      // 記事ディレクトリ配下の実ファイルを列挙してから消す
      const paths = await getHagakiClient().posts.repoPaths(uuid);
      if (paths.length === 0) {
        return { success: false, error: "ファイルが見つかりません" };
      }

      const result = await getHagakiClient().commits.commitFiles({
        deletePaths: paths,
        committer: this.getCommitter(session),
        commitMessage,
      });

      return {
        success: true,
        commitId: result.commitSha,
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
   * 特定のコミットでの記事データを取得
   */
  static async getPostAtCommit(
    slug: string,
    commitId: string,
  ): Promise<{ success: boolean; error?: string; data?: WikiPostDetail }> {
    try {
      const uuid = await this.resolveUuid(slug);
      if (!uuid) {
        return { success: false, error: "記事が見つかりません" };
      }

      const post = await getHagakiClient().posts.getFromRepo(uuid, {
        ref: commitId,
      });

      if (!post) {
        return { success: false, error: "ファイルが見つかりません" };
      }

      return { success: true, data: post };
    } catch (error) {
      console.error("GitHub API error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "指定されたバージョンの取得に失敗しました",
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

  /**
   * すべての記事を取得
   *
   * 一覧は配信中の `article.json` を使う (GitHub のディレクトリ走査より安く、
   * created / updated も付く)。本文が要る呼び出し側は getPost を使うこと。
   */
  static async getAllPosts(): Promise<{
    success: boolean;
    error?: string;
    data?: WikiPostDetail[];
  }> {
    try {
      const posts = await getHagakiClient().posts.list({
        sortBy: "updated",
        order: "desc",
      });

      return {
        success: true,
        data: posts.map((post) => ({ ...post, body: "" })),
      };
    } catch (error) {
      console.error("Content fetch error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "記事一覧の取得に失敗しました",
      };
    }
  }

  /**
   * すべての記事を取得（認証なし、ビルド時用）
   */
  static async getAllPostsForBuild(): Promise<{
    success: boolean;
    error?: string;
    data?: { slug: string }[];
  }> {
    try {
      const posts = await getHagakiClient().posts.list();
      return {
        success: true,
        data: posts.map((post) => ({ slug: post.slug })),
      };
    } catch (error) {
      console.error("Content fetch error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "記事一覧の取得に失敗しました",
      };
    }
  }

  /**
   * 画像を記事の assets 配下にアップロードする。
   *
   * コンテンツフォーマット上、記事画像は AVIF 固定で
   * `content/article/<articleId>/assets/<imageId>.avif` に置かれる。
   * AVIF への変換は投稿側 (ブラウザの `hagaki/image`) が行う。
   */
  static async uploadImage(
    file: File,
    session: AppSession,
    articleId: string,
  ): Promise<{
    success: boolean;
    error?: string;
    imageId?: string;
    url?: string;
    commitId?: string;
  }> {
    try {
      if (!articleId) {
        return { success: false, error: "記事 (articleId) が指定されていません" };
      }
      const arrayBuffer = await file.arrayBuffer();
      // 記事画像は AVIF 固定。変換は投稿側 (hagaki/image の processImage) の
      // 責務なので、ここでは形式とサイズだけ弾く。
      try {
        validateAvifUpload(new Uint8Array(arrayBuffer));
      } catch (error) {
        if (error instanceof ImageValidationError) {
          return {
            success: false,
            error:
              error.code === "size"
                ? "画像が大きすぎます (500KB 以下の AVIF にしてください)"
                : "画像は AVIF 形式のみ受け付けます",
          };
        }
        throw error;
      }
      const imageId = randomUUID();
      const filePath = this.getAssetPath(articleId, imageId);

      const result = await getHagakiClient().commits.commitFiles({
        files: [{ path: filePath, content: arrayBuffer }],
        committer: this.getCommitter(session),
        commitMessage: `🖼️ Upload image: ${imageId}`,
      });

      return {
        success: true,
        imageId,
        url: `/article/${articleId}/assets/${imageId}.avif`,
        commitId: result.commitSha,
      };
    } catch (error) {
      console.error("GitHub image upload error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "画像アップロードに失敗しました",
      };
    }
  }
}
