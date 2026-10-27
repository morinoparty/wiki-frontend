import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageTitle } from "@/lib/pageTitle";
import { getPostForEdit } from "@/server/posts";
import { PostEditorClient } from "./-components/PostEditorClient";
import { PostForbidden } from "./-components/PostForbidden";

// 記事の編集ページ (旧 app/(dashboard)/dashboard/posts/[postId]/page.tsx)。
// 編集対象は uuid で指定する。slug は変わりうるうえ、draft は
// slug-index に載らないため slug では解決できない。
export const Route = createFileRoute("/dashboard/posts/$postId")({
  // 編集画面はキャッシュした保存前の本文で開かないよう、毎回取り直す
  // (エディタは初期値を useState に取り込むため、古いデータを描くと
  // そのまま保存で巻き戻してしまう)
  staleTime: 0,
  gcTime: 0,
  preloadStaleTime: 0,
  loader: async ({ params }) => {
    if (!params.postId) throw notFound();
    const result = await getPostForEdit({ data: params.postId });
    // 権限が無いときは 404 にせず、エディタの代わりに案内を出す。
    // 記事の中身は返ってこないので、タイトルなども出さない
    if (result.code === "forbidden") return { forbidden: true as const };
    if (!result.success || !result.data) throw notFound();
    return { forbidden: false as const, post: result.data };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: pageTitle(
          loaderData && !loaderData.forbidden
            ? `${loaderData.post.title} の編集`
            : "ページの編集"
        ),
      },
    ],
  }),
  component: EditPost,
});

function EditPost() {
  const data = Route.useLoaderData();
  if (data.forbidden) return <PostForbidden />;
  // 別の記事へ移ったときに編集中の state を持ち越さない
  return <PostEditorClient key={data.post.uuid} post={data.post} />;
}
