import { Octokit } from "octokit";
import { WikiPostDetail } from "@/types/wiki";
import matter from "gray-matter";
import { Session } from "next-auth";

export class GitHubService {
  private static octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  private static owner = "morinoparty"; // TODO: 環境変数から取得
  private static repo = "wiki-contentdev"; // TODO: 環境変数から取得
  private static branch = "main";

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
   */
  private static getCommitter(session: Session | null) {
    return session?.user?.name && session?.user?.id
      ? {
          name: `${session.user.name} (${session.user.id})`,
          email: "players@morino.party",
        }
      : undefined;
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
    session: Session | null
  ): Promise<{ success: boolean; error?: string; commitId?: string }> {
    try {
      const filePath = this.getFilePath(post.slug);
      const content = matter.stringify(
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

      const contentEncoded = Buffer.from(content, "utf-8").toString("base64");
      const committer = this.getCommitter(session);

      const { data: commitData } =
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          message: commitMessage,
          content: contentEncoded,
          branch: this.branch,
          ...(committer && {
            committer,
            author: committer,
          }),
        });

      return {
        success: true,
        commitId: commitData.commit.sha,
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
    session: Session | null
  ): Promise<{ success: boolean; error?: string; commitId?: string }> {
    try {
      const filePath = this.getFilePath(post.slug);

      // 既存ファイルのSHAを取得
      const { data: fileData } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: this.branch,
      });

      if (Array.isArray(fileData) || fileData.type !== "file") {
        return { success: false, error: "ファイルが見つかりません" };
      }

      const content = matter.stringify(
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

      const contentEncoded = Buffer.from(content, "utf-8").toString("base64");
      const committer = this.getCommitter(session);

      const { data: commitData } =
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          message: commitMessage,
          content: contentEncoded,
          branch: this.branch,
          sha: fileData.sha,
          ...(committer && {
            committer,
            author: committer,
          }),
        });

      return {
        success: true,
        commitId: commitData.commit.sha,
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
    session: Session | null
  ): Promise<{ success: boolean; error?: string; commitId?: string }> {
    try {
      const filePath = this.getFilePath(slug);

      // 既存ファイルのSHAを取得
      const { data: fileData } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: this.branch,
      });

      if (Array.isArray(fileData) || fileData.type !== "file") {
        return { success: false, error: "ファイルが見つかりません" };
      }

      const committer = this.getCommitter(session);

      const { data: commitData } = await this.octokit.rest.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: commitMessage,
        sha: fileData.sha,
        branch: this.branch,
        ...(committer && {
          committer,
          author: committer,
        }),
      });

      return {
        success: true,
        commitId: commitData.commit.sha,
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
}
