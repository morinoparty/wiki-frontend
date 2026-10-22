import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit } from "lucide-react";
import { css } from "styled-system/css";
import { Button } from "@morinoparty/chlorophyll-react/components";
import { PostStatusBadge } from "@/components/dashboard/PostStatusBadge";
import { articleImageUrl } from "@/lib/content";
import { pageTitle } from "@/lib/pageTitle";
import { fetchDashboardPosts } from "@/server/dashboard";
import { buttonSize } from "@/components/buttonSize";

export const Route = createFileRoute("/dashboard/posts/")({
  loader: () => fetchDashboardPosts(),
  head: () => ({ meta: [{ title: pageTitle("投稿一覧") }] }),
  component: Home,
});

function Home() {
  const posts = Route.useLoaderData();

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
        {/* ページの主操作なので primary の lg */}
        <Button asChild intent="primary" size="lg" className={buttonSize({ size: "md" })}>
          <Link to="/dashboard/posts/new">
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
          bg: "bg.panel",
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
                <PostStatusBadge
                  draft={post.draft}
                  unpublished={post.unpublished}
                />
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
              {/* 一覧の行ごとの操作なので plain の sm で控えめにする */}
              <Button
                asChild
                intent="plain"
                size="sm"
                // 一覧の行に収まるよう、以前と同じく左右の余白だけ詰める
                className={css(buttonSize.raw({ size: "sm" }), { px: "12px" })}
              >
                <Link
                  to="/dashboard/posts/$postId"
                  params={{ postId: post.uuid }}
                >
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
