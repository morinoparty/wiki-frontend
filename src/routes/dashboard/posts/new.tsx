import { createFileRoute } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { PostCreationClient } from "@/components/dashboard/PostCreationClient";
import { ModalDialog } from "@morinoparty/chlorophyll-react/components";
import { pageTitle } from "@/lib/pageTitle";
import { fetchCategories } from "@/server/content";
import { fetchTakenSlugs } from "@/server/dashboard";

// 記事の新規作成。旧 app は @modal の intercepting route で一覧の上にモーダル
// 表示していたが、いまは常に単独ページとして出す
export const Route = createFileRoute("/dashboard/posts/new")({
  loader: async () => {
    // 使用中の slug は公開記事に加えて、下書き・デプロイ待ちの記事の分も
    // サーバー側で集めて正規化 (toUrlSlug) 済みで受け取る
    const [categories, existingSlugs] = await Promise.all([
      fetchCategories(),
      fetchTakenSlugs(),
    ]);
    return { categories, existingSlugs };
  },
  head: () => ({ meta: [{ title: pageTitle("新規作成") }] }),
  component: NewPost,
});

function NewPost() {
  const { categories, existingSlugs } = Route.useLoaderData();
  return (
    <ModalDialog.Root isPage className={css({ bg: "colorPalette.surface" })}>
      <PostCreationClient
        categories={categories}
        existingSlugs={existingSlugs}
      />
    </ModalDialog.Root>
  );
}
