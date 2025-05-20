import { getPostBySlug } from "@/lib/getPostBySlug";
import { notFound } from "next/navigation";
import { css } from "styled-system/css";
import { PostHeader } from "@/components/PostHeader";
import { PostBody } from "@/components/PostBody";
import { PostCta } from "@/components/PostCta";
import { Button } from "@/components/Button";
import Link from "next/link";
import { Edit } from "lucide-react";

// 動的ルートのパラメータ型
interface PageProps {
  params: Promise<{ postId: string }>;
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
        image={post.image}
        category={post.category}
        title={post.title}
        description={post.description}
      />
      <PostBody body={post.body} />
      <PostCta />

      <nav
        className={css({
          position: "fixed",
          zIndex: 10000000,
          bottom: "24px",
          right: "24px",
        })}
      >
        <Button asChild>
          <Link href={`/dashboard/posts/${post.slug}`}>
            <Edit />
            このページを編集
          </Link>
        </Button>
      </nav>
    </div>
  );
}
