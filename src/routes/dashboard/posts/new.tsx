import { createFileRoute } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { PostCreationClient } from "@/components/dashboard/PostCreationClient";
import { ModalDialogRoot } from "@/components/ModalDialogRoot";
import { pageTitle } from "@/lib/pageTitle";
import { fetchAllPosts, fetchCategories } from "@/server/content";

// 記事の新規作成。旧 app は @modal の intercepting route で一覧の上にモーダル
// 表示していたが、いまは常に単独ページとして出す
export const Route = createFileRoute("/dashboard/posts/new")({
  loader: async () => {
    const [categories, posts] = await Promise.all([
      fetchCategories(),
      fetchAllPosts(),
    ]);

    // slugをデコードして正規化
    const existingSlugs = posts.map((post) => {
      try {
        // URLエンコードされたslugをデコード
        return decodeURIComponent(post.slug);
      } catch {
        // デコードに失敗した場合はそのまま返す
        return post.slug;
      }
    });

    return { categories, existingSlugs };
  },
  head: () => ({ meta: [{ title: pageTitle("新規作成") }] }),
  component: NewPost,
});

function NewPost() {
  const { categories, existingSlugs } = Route.useLoaderData();
  return (
    <ModalDialogRoot isPage className={css({ bg: "colorPalette.surface" })}>
      <PostCreationClient
        categories={categories}
        existingSlugs={existingSlugs}
      />
    </ModalDialogRoot>
  );
}
