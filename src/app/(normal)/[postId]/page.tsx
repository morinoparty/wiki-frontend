import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/getPostBySlug";
import { getAllPosts } from "@/lib/getAllPosts";
import { articleImageUrl } from "@/lib/content";
import { notFound } from "next/navigation";
import { css } from "styled-system/css";
import { PostHeader } from "@/components/PostHeader";
import { PostBody } from "./components/PostBody";
import { PostCta } from "./components/PostCta";
import { PostContributors } from "./components/PostContributors";
import { Button } from "@/components/Button";
import Link from "next/link";
import { Edit } from "lucide-react";

// 動的ルートのパラメータ型
interface PageProps {
  params: Promise<{ postId: string }>;
}

// 「<記事タイトル> | もりのパーティ公式Wiki もりぱうぃき!」の形になる
// (接尾辞は root layout の title.template)。
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostBySlug(postId);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description || undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description || undefined,
      ...(post.thumbnail
        ? { images: [articleImageUrl(post.uuid, post.thumbnail.imageId)] }
        : {}),
    },
    twitter: {
      card: post.thumbnail ? "summary_large_image" : "summary",
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { postId } = await params;
  const post = await getPostBySlug(postId);
  if (!post) return notFound();

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
      <PostContributors articleId={post.uuid} />
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
        <Button
          asChild
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
          <Link href={`/dashboard/posts/${post.uuid}`}>
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

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ postId: post.slug.toLowerCase() }));
}
