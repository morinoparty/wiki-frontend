import { Button } from "@/components/Button";
import { articleImageUrl } from "@/lib/content";
import { Edit } from "lucide-react";
import Link from "next/link";
import { css } from "styled-system/css";
import { getDashboardPosts } from "./getDashboardPosts";

export default async function Home() {
  const posts = await getDashboardPosts();

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
            color: "colorPalette.fg",
            mb: "24px",
          })}
        >
          投稿一覧
        </h1>
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
        {posts.map((post, index) => (
          <div
            key={post.slug + index}
            className={css({
              display: "grid",
              gridTemplateColumns: "subgrid",
              gridColumn: "1/-1",
              padding: "12px",
              gap: "24px",
              borderBottom: "1px solid",
              borderColor: "border.subtle",
              _last: {
                borderBottom: "none",
              },
            })}
          >
            <img
              src={
                post.thumbnail
                  ? post.draft || post.unpublished
                    ? // CDN に無い記事のサムネイルはリポジトリ経由で読む
                      `/api/article-assets/${post.uuid}/${post.thumbnail.imageId}${
                        post.draft ? "?draft=1" : ""
                      }`
                    : articleImageUrl(post.uuid, post.thumbnail.imageId)
                  : "/assets/placeholder.svg"
              }
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
                  color: "colorPalette.fg",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                })}
              >
                {post.title || "(無題)"}
                {post.draft ? (
                  <span
                    className={css({
                      fontSize: "xs",
                      fontWeight: "normal",
                      color: "colorPalette.fg",
                      bg: "gray.200",
                      borderRadius: "full",
                      px: "8px",
                      py: "2px",
                      flexShrink: 0,
                    })}
                  >
                    下書き
                  </span>
                ) : post.unpublished ? (
                  <span
                    className={css({
                      fontSize: "xs",
                      fontWeight: "normal",
                      color: "colorPalette.fg",
                      bg: "amber.200",
                      borderRadius: "full",
                      px: "8px",
                      py: "2px",
                      flexShrink: 0,
                    })}
                  >
                    配信待ち
                  </span>
                ) : null}
              </h2>
              <p
                className={css({
                  textStyle: "body",
                  color: "colorPalette.fg",
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
                })}
                asChild
              >
                <Link href={`/dashboard/posts/${post.uuid}`}>
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
