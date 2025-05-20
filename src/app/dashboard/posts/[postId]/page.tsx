import { MilkdownEditor } from "@/components/Editor";
import { PostHeaderEdit } from "@/components/PostHeaderEdit";
import { getPostBySlug } from "@/lib/getPostBySlug";
import { Button } from "@chakra-ui/react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { css } from "styled-system/css";

interface PageProps {
  params: { postId: string };
}

export default async function Page({ params }: PageProps) {
  if (!params.postId) return notFound();
  const post = await getPostBySlug(params.postId);
  if (!post) return notFound();
  return (
    <div
      className={css({
        position: "relative",
        pb: "200px",
      })}
    >
      <nav
        className={css({
          position: "sticky",
          top: 0,
          zIndex: 10000000,
          width: "100%",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "32px",
          backgroundColor: "white",
          textStyle: "body",
        })}
      >
        <Button variant="ghost" textStyle={"body"} color={"leaf.600"} asChild>
          <Link href="/dashboard">
            <ChevronLeft />
            戻る
          </Link>
        </Button>

        <div>
          <h2
            className={css({
              textStyle: "body",
              color: "leaf.700",
              fontWeight: "bold",
            })}
          >
            ページの編集
          </h2>
        </div>

        <div>
          <Button textStyle={"body"}>保存</Button>
        </div>
      </nav>

      <PostHeaderEdit
        image={post.image}
        category={post.category}
        title={post.title}
        description={post.description}
      />

      <div
        className={css({
          px: "90px",
          pt: "48px",
        })}
      >
        <MilkdownEditor defaultValue={post.body} />
      </div>
    </div>
  );
}
