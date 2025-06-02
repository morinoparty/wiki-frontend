"use server";

import { WikiPostDetail } from "@/types/wiki";
import { revalidatePath } from "next/cache";
import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import matter from "gray-matter";

function toUrlSlug(str: string): string {
  // encodeURIComponentで日本語もURLセーフに
  return encodeURIComponent(
    str
      .normalize("NFKC")
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0)
      ) // 全角英数字→半角
      .replace(/\s+/g, "-") // 空白→ハイフン
      .replace(/[\u3000]/g, "-") // 全角スペース→ハイフン
      .replace(/--+/g, "-") // ハイフン連続→1つ
      .replace(/^-+|-+$/g, "") // 先頭・末尾ハイフン除去
      .toLowerCase()
  );
}

export async function savePostAction(
  form: WikiPostDetail,
  commitMessage?: string
) {
  // 認証ユーザー情報を取得
  const session = await auth();
  const committer =
    session?.user?.name && session?.user?.id
      ? {
          name: `${session.user.name} (${session.user.id})`,
          email: "players@morino.party",
        }
      : undefined;

  // Octokitのセットアップ
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN }); // GITHUB_TOKENは環境変数で用意

  // コミット先情報
  const owner = "morinoparty"; // TODO: 実際の値に置き換え
  const repo = "wiki-contentdev"; // TODO: 実際の値に置き換え
  const branch = "main"; // 例: mainブランチ

  const slug = toUrlSlug(form.slug);

  const filePath = `content/wiki/${slug}.md`; // 保存先のパス

  // ファイルの最新SHA（既存の場合）を取得
  let fileSha: string | undefined = undefined;
  let existingVersion = 1;
  let existingCreatedAt: string | undefined = undefined;
  let existingCreatedBy: string | undefined = undefined;
  let existingDocumentOwner: string | undefined = undefined;
  let existingIsLocked = false;

  try {
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });
    if (!Array.isArray(fileData) && fileData.type === "file" && fileData.sha) {
      fileSha = fileData.sha;

      // 既存ファイルの内容を取得してメタデータを抽出
      const existingContent = Buffer.from(fileData.content, "base64").toString(
        "utf-8"
      );
      const existingMatter = matter(existingContent);
      existingVersion = (existingMatter.data.version || 0) + 1;
      existingCreatedAt = existingMatter.data.createdAt;
      existingCreatedBy = existingMatter.data.createdBy;
      existingDocumentOwner = existingMatter.data.documentOwner;
      existingIsLocked = existingMatter.data.isLocked || false;
    }
  } catch (e) {
    // ファイルが存在しない場合は404になるので無視
    if (
      typeof e === "object" &&
      e !== null &&
      "status" in e &&
      e.status !== 404
    ) {
      throw e;
    }
  }

  // ロックチェック：既存ファイルがロックされている場合、documentOwnerのみが編集可能
  const currentUserId = session?.user?.id;
  if (
    existingIsLocked &&
    existingDocumentOwner &&
    currentUserId !== existingDocumentOwner
  ) {
    throw new Error(
      `このドキュメントはロックされています。編集権限があるのは所有者（${existingDocumentOwner}）のみです。`
    );
  }

  // Markdown形式に変換
  const now = new Date().toISOString();
  const content = matter.stringify(form.body || "", {
    title: form.title,
    slug: form.slug,
    category: form.category,
    description: form.description,
    image: form.image || "",
    // 時間関連
    createdAt: form.createdAt || existingCreatedAt || now,
    updatedAt: now,
    // 作成者・所有者情報
    createdBy: form.createdBy || existingCreatedBy || session?.user?.id,
    documentOwner:
      form.documentOwner || existingDocumentOwner || session?.user?.id,
    lastModifiedBy: session?.user?.id,
    // 公開状態・権限
    status: form.status || "draft",
    visibility: form.visibility || "public",
    // その他メタデータ
    version: form.version || existingVersion,
    priority: form.priority,
    // ロック機能
    isLocked: form.isLocked || false,
    lockedAt: form.isLocked ? form.lockedAt || now : undefined,
    lockedBy: form.isLocked ? form.lockedBy || session?.user?.id : undefined,
  });

  console.log("content", content);

  // Base64エンコード
  const contentEncoded = Buffer.from(content, "utf-8").toString("base64");

  // ファイルを作成または更新
  const { data: commitData } =
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: commitMessage || `Add or update post: ${form.slug}.md`,
      content: contentEncoded,
      branch,
      sha: fileSha,
      ...(committer && {
        committer,
        author: committer,
      }),
    });

  // 必要に応じてパスの再検証
  revalidatePath("/dashboard/posts");

  if (commitData.commit.html_url) {
    // girhub コミットidを取得
    const commitId = commitData.commit.sha;
    // GitHubのコミットURLにリダイレクト
    redirect(`/dashboard/commit/${commitId}`);
  }

  return { success: true };
}
