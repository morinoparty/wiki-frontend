import { NotFound } from "@/components/NotFound";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Edit } from "lucide-react";
import { css } from "styled-system/css";
import { Button } from "@morinoparty/chlorophyll-react/components";
import { PostHeader } from "@/components/PostHeader";
import { PostBody } from "@/components/post/PostBody";
import { PostContributors } from "@/components/post/PostContributors";
import { PostCta } from "@/components/post/PostCta";
import { articleImageUrl } from "@/lib/content";
import { pageTitle } from "@/lib/pageTitle";
import { fetchPostPage } from "@/server/post";

export const Route = createFileRoute("/_normal/$postId")({
  loader: async ({ params }) => {
    const data = await fetchPostPage({ data: params.postId });
    if (!data) throw notFound();
    return data;
  },
  // 「<記事タイトル> | もりのパーティ公式Wiki もりぱうぃき!」の形になる
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { post } = loaderData;
    const image = post.thumbnail
      ? articleImageUrl(post.uuid, post.thumbnail.imageId)
      : undefined;
    const description = post.description || undefined;

    return {
      meta: [
        { title: pageTitle(post.title) },
        ...(description
          ? [
              { name: "description", content: description },
              { property: "og:description", content: description },
            ]
          : []),
        { property: "og:type", content: "article" },
        { property: "og:title", content: post.title },
        ...(image ? [{ property: "og:image", content: image }] : []),
        {
          name: "twitter:card",
          content: image ? "summary_large_image" : "summary",
        },
      ],
    };
  },
  component: Post,
  // loader の notFound() をこのルートで受け、公開レイアウトの内側に出す
  notFoundComponent: NotFound,
});

function Post() {
  const { post, contributors } = Route.useLoaderData();

  return (
    <div
      className={css({
        width: "100%",
        minHeight: "100vh",
        position: "relative",
      })}
    >
      <PostHeader
        image={
          post.thumbnail
            ? articleImageUrl(post.uuid, post.thumbnail.imageId)
            : undefined
        }
        category={post.category}
        title={post.title}
        description={post.description}
      />
      <PostBody body={post.body} articleId={post.uuid} />
      {contributors && <PostContributors data={contributors} />}
      <PostCta />

      <nav
        className={css({
          position: "fixed",
          zIndex: 100,
          bottom: {
            base: "24px",
            mdDown: "calc(70px + 16px)",
          },
          right: {
            base: "24px",
            mdDown: "16px",
          },
        })}
      >
        {/*
          記事を編集する主導線なので primary の lg。
          スマホでは丸いフローティングボタンにするため、寸法と角丸だけを上書きする
        */}
        <Button
          asChild
          intent="primary"
          size="lg"
          className={css({
            width: {
              base: undefined,
              mdDown: "64px",
            },
            maxWidth: {
              base: undefined,
              mdDown: "64px",
            },
            height: {
              base: undefined,
              mdDown: "64px",
            },
            minWidth: {
              base: undefined,
              mdDown: "64px",
            },
            maxHeight: {
              base: undefined,
              mdDown: "64px",
            },
            borderRadius: {
              base: undefined,
              mdDown: "24px",
            },
          })}
        >
          <Link to="/dashboard/posts/$postId" params={{ postId: post.uuid }}>
            <Edit />
            <span
              className={css({
                display: {
                  base: "initial",
                  mdDown: "none",
                },
              })}
            >
              このページを編集
            </span>
          </Link>
        </Button>
      </nav>
    </div>
  );
}
