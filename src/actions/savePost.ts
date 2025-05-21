"use server";

import { WikiPostDetail } from "@/types/wiki";
import { revalidatePath } from "next/cache";
import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

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
          email: "account@morino.party",
        }
      : undefined;

  // Octokitのセットアップ
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN }); // GITHUB_TOKENは環境変数で用意

  // コミット先情報
  const owner = "morinoparty"; // TODO: 実際の値に置き換え
  const repo = "wiki-contentdev"; // TODO: 実際の値に置き換え
  const branch = "main"; // 例: mainブランチ
  const filePath = `content/wiki/${form.slug}.json`; // 保存先のパス

  // JSON形式に変換
  const content = JSON.stringify(
    {
      title: form.title,
      slug: form.slug,
      category: form.category,
      description: form.description,
      image: form.image || "",
      body: form.body,
    },
    null,
    2
  );

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
      message: commitMessage || `Add or update post: ${form.title}`,
      content: contentEncoded,
      branch,
      sha: fileSha,
      ...(committer && {
        committer,
        author: committer,
      }),
    });

  console.log("commitData", commitData.commit);

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
