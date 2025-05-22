import { Cta } from "@/components/Cta";
import WikiCard from "@/components/WikiCard";
import { WikiCardGrid } from "@/components/WikiCardGrid";
import { getAllPosts } from "@/lib/getAllPosts";
import { css } from "styled-system/css";

export default async function Home() {
  const posts = await getAllPosts({
    sortBy: "date",
    order: "desc",
  });

  return (
    <div className={css({})}>
      <div
        className={css({
          width: "100%",
          minHeight: "420px",
          backgroundImage: "url('/assets/top-header.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        })}
      ></div>

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
          })}
        >
          <p
            className={css({
              textStyle: "body",
              color: "leaf.600/50",
              fontSize: {
                base: "16px",
                lgDown: "14px",
              },
              mb: {
                base: "28px",
                lgDown: "24px",
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
              color: "leaf.600",
              width: {
                base: "50%",
                lgDown: "100%",
              },
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
              color: "leaf.600",
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
              color: "leaf.600",
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
