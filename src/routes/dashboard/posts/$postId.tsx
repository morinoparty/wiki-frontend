import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageTitle } from "@/lib/pageTitle";
import { getPostForEdit } from "@/server/posts";
import { PostEditorClient } from "./-components/PostEditorClient";

// 記事の編集ページ (旧 app/(dashboard)/dashboard/posts/[postId]/page.tsx)。
// 編集対象は uuid で指定する。slug は変わりうるうえ、draft は
// slug-index に載らないため slug では解決できない。
export const Route = createFileRoute("/dashboard/posts/$postId")({
  loader: async ({ params }) => {
    if (!params.postId) throw notFound();
    const result = await getPostForEdit({ data: params.postId });
    if (!result.success || !result.data) throw notFound();
    return result.data;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: pageTitle(
          loaderData ? `${loaderData.title} の編集` : "ページの編集"
        ),
      },
    ],
  }),
  component: EditPost,
});

function EditPost() {
  const post = Route.useLoaderData();
  // 別の記事へ移ったときに編集中の state を持ち越さない
  return <PostEditorClient key={post.uuid} post={post} />;
}
