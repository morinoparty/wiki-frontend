import { Octokit } from "octokit";
import type { Committer } from "hagaki";
import { committerFromBetterAuth } from "hagaki/auth/better-auth";
import { getHagakiClient, WIKI_REPO } from "@/lib/hagaki";
import { WikiPostDetail } from "@/types/wiki";
import matter from "gray-matter";
import type { AppSession } from "@/lib/auth";
import { randomUUID } from "crypto";
import path from "path";

/**
 * GitHub 上の wiki コンテンツを読み書きするサービス。
 *
 * 書き込み系 (作成 / 更新 / 削除 / 画像アップロード) は hagaki の
 * `commits.commitFiles` に委譲する。読み取り系 (getContent / listCommits /
 * compareCommits) は hagaki に対応 API が無いため Octokit を直接使う。
 */
export class GitHubService {
  private static _octokit: Octokit | null = null;
  private static owner = WIKI_REPO.owner;
  private static repo = WIKI_REPO.repo;
  private static branch = WIKI_REPO.branch;

  /**
   * 読み取り用の Octokit。モジュール初期化時ではなく初回アクセス時に
   * GITHUB_TOKEN を読むことで、Workers のリクエスト単位の env に追従する。
   */
  private static get octokit(): Octokit {
    if (!this._octokit) {
      this._octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    }
    return this._octokit;
  }

  /**
   * スラッグからファイルパスを生成
   */
  private static getFilePath(slug: string): string {
    return `content/wiki/${this.toUrlSlug(slug)}.md`;
  }

  /**
   * URLスラッグを生成
   */
  private static toUrlSlug(str: string): string {
    return encodeURIComponent(
      str
        .normalize("NFKC")
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
          String.fromCharCode(s.charCodeAt(0) - 0xfee0)
        )
        .replace(/\s+/g, "-")
        .replace(/[\u3000]/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()
    );
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
      { defaultEmail: "players@morino.party" }
    );
  }

  /**
   * 記事本文と frontmatter からコミットするファイル内容を組み立てる
   */
  private static buildContent(post: WikiPostDetail): string {
    return matter.stringify(
      post.body || "",
      this.cleanMetadata({
        title: post.title,
        slug: post.slug,
        category: post.category,
        description: post.description,
        image: post.image || "",
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        createdBy: post.createdBy,
        documentOwner: post.documentOwner,
        lastModifiedBy: post.lastModifiedBy,
        status: post.status,
        visibility: post.visibility,
        version: post.version,
        priority: post.priority,
        isLocked: post.isLocked,
        lockedAt: post.lockedAt,
        lockedBy: post.lockedBy,
      })
    );
  }

  /**
   * メタデータからundefined値を除外
   */
  private static cleanMetadata(
    metadata: Record<string, unknown>
  ): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * 記事の存在をチェック
   */
  static async checkPostExists(slug: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(slug);
      await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: this.branch,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 記事を取得
   */
  static async getPost(slug: string): Promise<WikiPostDetail | null> {
    try {
      const filePath = this.getFilePath(slug);
      const { data: fileData } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: this.branch,
      });

      if (Array.isArray(fileData) || fileData.type !== "file") {
        return null;
      }

      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      const parsed = matter(content);

      return {
        body: parsed.content,
        ...parsed.data,
      } as WikiPostDetail;
    } catch {
      return null;
    }
  }

  /**
   * 新しい記事を作成
   */
  static async createPost(
    post: WikiPostDetail,
    commitMessage: string,
    session: AppSession
  ): Promise<{ success: boolean; error?: string; commitId?: string }> {
    try {
      const filePath = this.getFilePath(post.slug);

      const result = await getHagakiClient().commits.commitFiles({
        files: [{ path: filePath, content: this.buildContent(post) }],
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
   * 記事を更新
   */
  static async updatePost(
    post: WikiPostDetail,
    commitMessage: string,
    session: AppSession
  ): Promise<{ success: boolean; error?: string; commitId?: string }> {
    try {
      const filePath = this.getFilePath(post.slug);

      // commitFiles は対象ファイルが無くても新規作成してしまうため、
      // 「更新」の意味を保つよう事前に存在確認する
      const { data: fileData } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: this.branch,
      });

      if (Array.isArray(fileData) || fileData.type !== "file") {
        return { success: false, error: "ファイルが見つかりません" };
      }

      const result = await getHagakiClient().commits.commitFiles({
        files: [{ path: filePath, content: this.buildContent(post) }],
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
   * 記事を削除
   */
  static async deletePost(
    slug: string,
    commitMessage: string,
    session: AppSession
  ): Promise<{ success: boolean; error?: string; commitId?: string }> {
    try {
      const filePath = this.getFilePath(slug);

      // 存在しないパスを deletePaths に積むと createTree が 422 で失敗するため、
      // 事前に存在確認して分かりやすいエラーを返す
      const { data: fileData } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: this.branch,
      });

      if (Array.isArray(fileData) || fileData.type !== "file") {
        return { success: false, error: "ファイルが見つかりません" };
      }

      const result = await getHagakiClient().commits.commitFiles({
        deletePaths: [filePath],
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
      const filePath = this.getFilePath(slug);

      // ファイルのコミット履歴を取得
      const { data: commits } = await this.octokit.rest.repos.listCommits({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        per_page: 50,
      });

      const history = commits.map((commit, index) => ({
        commitId: commit.sha,
        version: commits.length - index, // 新しいものほど大きいバージョン番号
        message: commit.commit.message,
        author: commit.commit.author?.name || "Unknown",
        date: commit.commit.author?.date || new Date().toISOString(),
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
    commitId: string
  ): Promise<{ success: boolean; error?: string; data?: WikiPostDetail }> {
    try {
      const filePath = this.getFilePath(slug);

      const { data: fileData } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: commitId,
      });

      if (Array.isArray(fileData) || fileData.type !== "file") {
        return { success: false, error: "ファイルが見つかりません" };
      }

      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      const parsed = matter(content);

      return {
        success: true,
        data: {
          body: parsed.content,
          ...parsed.data,
        } as WikiPostDetail,
      };
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
    toCommit: string
  ): Promise<{ success: boolean; error?: string; data?: string }> {
    try {
      const filePath = this.getFilePath(slug);

      // GitHub APIでコミット間の差分を取得
      const { data: comparison } = await this.octokit.rest.repos.compareCommits(
        {
          owner: this.owner,
          repo: this.repo,
          base: fromCommit,
          head: toCommit,
        }
      );

      // 該当ファイルの差分を探す
      const fileDiff = comparison.files?.find(
        (file) => file.filename === filePath
      );

      if (!fileDiff) {
        return { success: false, error: "差分が見つかりません" };
      }

      return {
        success: true,
        data: fileDiff.patch || "",
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
   */
  static async getAllPosts(): Promise<{
    success: boolean;
    error?: string;
    data?: WikiPostDetail[];
  }> {
    try {
      // content/wikiディレクトリの内容を取得
      const { data: contents } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: "content/wiki",
        ref: this.branch,
      });

      if (!Array.isArray(contents)) {
        return { success: false, error: "ディレクトリの取得に失敗しました" };
      }

      const posts: WikiPostDetail[] = [];

      // 各マークダウンファイルの内容を取得
      for (const item of contents) {
        if (item.type === "file" && item.name.endsWith(".md")) {
          const slug = item.name.replace(".md", "");
          const post = await this.getPost(slug);
          if (post) {
            posts.push(post);
          }
        }
      }

      // 更新日時順でソート（新しいもの順）
      posts.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || a.date);
        const dateB = new Date(b.updatedAt || b.createdAt || b.date);
        return dateB.getTime() - dateA.getTime();
      });

      return {
        success: true,
        data: posts,
      };
    } catch (error) {
      console.error("GitHub API error:", error);
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
      // content/wikiディレクトリの内容を取得
      const { data: contents } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: "content/wiki",
        ref: this.branch,
      });

      if (!Array.isArray(contents)) {
        return { success: false, error: "ディレクトリの取得に失敗しました" };
      }

      const slugs: { slug: string }[] = [];

      // 各マークダウンファイルからスラッグを取得
      for (const item of contents) {
        if (item.type === "file" && item.name.endsWith(".md")) {
          const slug = item.name.replace(".md", "");
          slugs.push({ slug });
        }
      }

      return {
        success: true,
        data: slugs,
      };
    } catch (error) {
      console.error("GitHub API error:", error);
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
   * 画像ファイルをcontent/img配下にアップロード
   */
  static async uploadImage(
    file: File,
    session: AppSession
  ): Promise<{ success: boolean; error?: string; url?: string; commitId?: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ext = path.extname(file.name);
      const filename = `${randomUUID()}${ext}`;
      const filePath = `content/img/${filename}`;

      const result = await getHagakiClient().commits.commitFiles({
        files: [{ path: filePath, content: arrayBuffer }],
        committer: this.getCommitter(session),
        commitMessage: `Upload image: ${file.name}`,
      });

      return {
        success: true,
        url: `/img/${filename}`,
        commitId: result.commitSha,
      };
    } catch (error) {
      console.error("GitHub image upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "画像アップロードに失敗しました",
      };
    }
  }
}
