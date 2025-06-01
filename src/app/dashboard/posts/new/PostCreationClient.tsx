"use client";

import { DashboardPostAddModal } from "./DashboardPostAddModal";
import { savePostAction } from "@/actions/savePost";
import { WikiPostDetail, WikiCategory } from "@/types/wiki";

interface PostCreationClientProps {
  categories: WikiCategory[];
  existingSlugs: string[];
}

export function PostCreationClient({
  categories,
  existingSlugs,
}: PostCreationClientProps) {
  const handleCreatePost = async (data: {
    title: string;
    url: string;
    description: string;
    category: string;
  }) => {
    try {
      const postData: WikiPostDetail = {
        title: data.title,
        slug: data.url,
        body: data.description || "",
        category: data.category,
        description: data.description || "",
        date: new Date().toISOString(),
      };

      await savePostAction(postData, `新規ページ「${data.title}」を作成`);

      // 成功時のリダイレクトなどの処理はsavePostAction内で行われる
    } catch (error) {
      console.error("Failed to create post:", error);
      // TODO: エラーハンドリングの実装
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
