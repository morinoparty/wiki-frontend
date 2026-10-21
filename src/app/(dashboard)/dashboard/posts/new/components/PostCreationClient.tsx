"use client";

import { DashboardPostAddModal } from "./DashboardPostAddModal";
import type { PostFormValues } from "./DashboardPostFormModal";
import { createPost } from "@/actions/create-post";
import { WikiCategory } from "@/types/wiki";
import { CreatePostInput } from "@/actions/types";
import { useRouter } from "next/navigation";
import { toaster } from "@/components/ui/toaster";

interface PostCreationClientProps {
  categories: WikiCategory[];
  existingSlugs: string[];
}

export function PostCreationClient({
  categories,
  existingSlugs,
}: PostCreationClientProps) {
  const router = useRouter();

  const handleCreatePost = async (
    data: PostFormValues & { category: string }
  ) => {
    try {
      const createPostInput: CreatePostInput = {
        title: data.title,
        slug: data.url,
        body: data.description || "",
        category: data.category,
        description: data.description || "",
        // カテゴリが宣言した option の値 (座標・enum など)。空なら送らない
        ...(data.option &&
          Object.keys(data.option).length > 0 && { option: data.option }),
      };

      const result = await createPost(createPostInput, {
        commitMessage: `新規ページ「${data.title}」を作成`,
      });

      if (!result.success) {
        console.error("Failed to create post:", result.error);
        toaster.error({
          title: "記事の作成に失敗しました",
          description: result.error || "もう一度お試しください。",
        });
        return;
      }

      console.log("Post created successfully:", result.data);

      // 成功通知を表示
      toaster.success({
        title: "記事を作成しました",
        description: `「${data.title}」が正常に作成されました。`,
      });

      // 成功時は編集ページへ。編集ルートは uuid ベース (slug だと配信側の
      // slug-index 反映を待つ必要があり、draft はそもそも載らない)。
      if (result.data) {
        router.push(`/dashboard/posts/${result.data.uuid}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "記事の作成に失敗しました";
      console.error("Failed to create post:", errorMessage);

      toaster.error({
        title: "記事の作成に失敗しました",
        description: errorMessage,
      });
    }
  };

  return (
    <DashboardPostAddModal
      categories={categories}
      existingSlugs={existingSlugs}
      onCreatePost={handleCreatePost}
    />
  );
}
