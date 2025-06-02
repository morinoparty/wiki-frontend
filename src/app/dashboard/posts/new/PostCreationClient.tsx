"use client";

import { DashboardPostAddModal } from "./DashboardPostAddModal";
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

  const handleCreatePost = async (data: {
    title: string;
    url: string;
    description: string;
    category: string;
  }) => {
    try {
      const createPostInput: CreatePostInput = {
        title: data.title,
        slug: data.url,
        body: data.description || "",
        category: data.category,
        description: data.description || "",
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

      // 成功時は記事の詳細ページにリダイレクト
      if (result.data) {
        router.push(`/dashboard/posts/${result.data.slug}`);
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
