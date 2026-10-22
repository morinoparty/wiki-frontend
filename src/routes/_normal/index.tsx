import { Cta } from "@/components/Cta";
import WikiCard from "@/components/WikiCard";
import { WikiCardGrid } from "@/components/WikiCardGrid";
import { createFileRoute } from "@tanstack/react-router";
import { fetchAllPosts } from "@/server/content";
import { css } from "styled-system/css";

export const Route = createFileRoute("/_normal/")({
  loader: () => fetchAllPosts({ data: { sortBy: "updated", order: "desc" } }),
  component: Home,
});

function Home() {
  // splice で先頭から 6 件ずつ取り出すので、loader のデータは複製してから使う
  const posts = [...Route.useLoaderData()];

  return (
    <div className={css({})}>
      <div
        className={css({
          position: "relative",
          width: "100%",
          minHeight: "420px",
        })}
      >
        <img
          src="/assets/top-header.png"
          alt="もりのパーティWikiのヘッダー画像"
          width={1920}
          height={420}
          className={css({
            objectFit: "cover",
            maxWidth: "100%",
            height: "420px",
            objectPosition: "center",
          })}
          loading="eager"
          fetchPriority="high"
        />
      </div>

      <div
        className={css({
          px: {
            base: "90px",
            lgDown: "24px",
          },
          pt: { base: "40px", lgDown: "32px" },
          pb: "128px",
        })}
      >
        <header
          className={css({
            mb: {
              base: "6.389vw",
              lgDown: "100px",
            },
            display: "grid",
            gridTemplateColumns: {
              base: "1fr 1fr",
              lgDown: "1fr",
            },
          })}
        >
          <p
            className={css({
              textStyle: "body",
              color: "colorPalette.fg.subtle",
              fontSize: {
                base: "16px",
                lgDown: "14px",
              },
              mb: {
                base: "28px",
                lgDown: "24px",
              },

              gridColumn: {
                base: "1 / -1",
              },
            })}
          >
            Minecraft コミュニティ「もりのパーティ」の公式Wiki
          </p>

          <img
            src="/assets/logo.svg"
            className={css({
              height: {
                base: "48px",
                lgDown: "38px",
              },
              width: "auto",
              mb: "32px",
            })}
            alt="もりのパーティWikiのロゴ"
          />

          <p
            className={css({
              textStyle: "body",
              color: "colorPalette.fg",
              width: "100%",
            })}
          >
            ここはみんなでもりぱに関する情報の共有をする場所です！もりぱにログインしたことがあれば、すぐに使い始めることができます。
          </p>
        </header>

        <section
          className={css({
            mb: {
              base: "6.389vw",
              lgDown: "128px",
            },
          })}
        >
          <h2
            className={css({
              textStyle: "heading1",
              color: "colorPalette.fg",
              mb: {
                base: "28px",
                lgDown: "32px",
              },
            })}
          >
            最近の投稿
          </h2>

          <WikiCardGrid>
            {posts.splice(0, 6).map((post) => (
              <WikiCard key={post.slug} post={post} />
            ))}
          </WikiCardGrid>
        </section>

        <section
          className={css({
            mb: "148px",
          })}
        >
          <h2
            className={css({
              textStyle: "heading1",
              color: "colorPalette.fg",
              mb: "28px",
            })}
          >
            おすすめのページ
          </h2>

          <WikiCardGrid>
            {posts.splice(0, 6).map((post) => (
              <WikiCard key={post.slug} post={post} />
            ))}
          </WikiCardGrid>
        </section>

        <div
          className={css({
            width: "calc(100% + 24px)",
            ml: "-12px",
          })}
        >
          <Cta />
        </div>
      </div>
    </div>
  );
}
