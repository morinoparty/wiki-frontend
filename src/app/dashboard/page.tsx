
import { Button } from "@/components/Button";
import { getAllPosts } from "@/lib/getAllPosts";
import { Edit } from "lucide-react";
import Link from "next/link";
import { css } from "styled-system/css";

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <div
      className={css({
        px: "90px",
        pt: "48px",
      })}
    >
      <header
        className={css({
          mb: "64px",
        })}
      >
        <h1
          className={css({
            textStyle: "heading1",
            color: "leaf.600",
            mb: "24px",
          })}
        >
          管理画面
        </h1>
        <p
          className={css({
            textStyle: "body",
            color: "leaf.600",
            mb: "24px",
            width: "50%",
          })}
        >
          もりのパーティWikiの管理画面です。ここでは、Wikiのコンテンツを管理したり、ユーザーを管理したりすることができます。ここでの操作は、Wikiのコンテンツに反映されますので、注意して操作してください。
        </p>
      </header>

      <div
        className={css({
          display: "flex",
          gap: "24px",
          mb: "24px",
          alignItems: "center",
          justifyContent: "end",
        })}
      >
        <Button asChild>
          <Link href="/dashboard/posts/new">
            <Edit />
            新規作成
          </Link>
        </Button>
      </div>

      <main
        className={css({
          display: "grid",
          gridTemplateColumns: "100px 1fr auto",
          gridTemplateAreas: `
            "img title actions"
            `,
          bg: "white",
          padding: "16px",
          borderRadius: "24px",
          gap: "0px",
          marginBottom: "128px",
        })}
      >
        {posts.map((post) => (
          <div
            key={post.slug}
            className={css({
              display: "grid",
              gridTemplateColumns: "subgrid",
              gridColumn: "1/-1",
              padding: "12px",
              gap: "24px",
              borderBottom: "1px solid",
              borderColor: "leaf.50",
              _last: {
                borderBottom: "none",
              },
            })}
          >
            <img
              src={post.image || "/assets/placeholder.svg"}
              alt={post.title}
              className={css({
                display: "block",
                borderRadius: "12px",
                gridArea: "img",
                aspectRatio: "1/1",
                objectFit: "cover",
                objectPosition: "center",
              })}
            />
            <div
              className={css({
                display: "flex",
                flexDirection: "column",
                gridArea: "title",
                overflow: "hidden",
                justifyContent: "center",
              })}
            >
              <h2
                className={css({
                  textStyle: "body",
                  color: "leaf.600",
                  fontWeight: "bold",
                })}
              >
                {post.title}
              </h2>
              <p
                className={css({
                  textStyle: "body",
                  color: "leaf.600",
                  opacity: 0.5,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                })}
              >
                {post.description}
              </p>
            </div>
            <div
              className={css({
                display: "grid",
                gridArea: "actions",
                gridTemplateColumns: "auto 1fr",
                gap: "12px",
                justifyContent: "end",
                alignItems: "center",
              })}
            >
              <Button
                size="sm"
                variant="ghost"
                className={css({
                  px: "12px",
                  color: "leaf.600",
                })}
                _hover={{
                  backgroundColor: "leaf.50",
                }}
                asChild
              >
                <Link href={`/dashboard/posts/${post.slug}`}>
                  <Edit />
                  編集
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
