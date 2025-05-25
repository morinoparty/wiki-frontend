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

  // Markdown形式に変換
  const content = matter.stringify(form.body || "", {
    title: form.title,
    slug: form.slug,
    category: form.category,
    description: form.description,
    image: form.image || "",
  });

  console.log("content", content);

  // Base64エンコード
  const contentEncoded = Buffer.from(content, "utf-8").toString("base64");

  // ファイルの最新SHA（既存の場合）を取得
  let fileSha: string | undefined = undefined;
  try {
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });
    if (!Array.isArray(fileData) && fileData.sha) fileSha = fileData.sha;
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
