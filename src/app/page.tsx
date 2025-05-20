import { Cta } from "@/components/Cta";
import WikiCard from "@/components/WikiCard";
import { getAllPosts } from "@/lib/getAllPosts";
import { css } from "styled-system/css";
import { Grid } from "styled-system/jsx";

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
          px: "90px",
          pt: "40px",
          pb: "128px",
        })}
      >
        <header
          className={css({
            mb: "86px",
          })}
        >
          <p
            className={css({
              textStyle: "body",
              color: "leaf.600/50",
              mb: "28px",
            })}
          >
            Minecraft コミュニティ「もりのパーティ」の公式Wiki
          </p>

          <img
            src="/assets/logo.svg"
            className={css({
              height: "48px",
              width: "auto",
              mb: "38px",
            })}
            alt="もりのパーティWikiのロゴ"
          />

          <p
            className={css({
              textStyle: "body",
              color: "leaf.600",
              width: "50%",
            })}
          >
            ここはみんなでもりぱに関する情報の共有をする場所です！もりぱにログインしたことがあれば、すぐに使い始めることができます。
          </p>
        </header>

        <section
          className={css({
            mb: "92px",
          })}
        >
          <h2
            className={css({
              textStyle: "heading1",
              color: "leaf.600",
              mb: "28px",
            })}
          >
            最近の投稿
          </h2>

          <Grid
            gridTemplateColumns={{
              base: "repeat(3, 1fr)",
            }}
            gap={"64px 24px"}
          >
            {posts.splice(0, 6).map((post) => (
              <WikiCard key={post.slug} post={post} />
            ))}
          </Grid>
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

          <Grid
            gridTemplateColumns={{
              base: "repeat(3, 1fr)",
            }}
            gap={"64px 24px"}
          >
            {posts.splice(0, 6).map((post) => (
              <WikiCard key={post.slug} post={post} />
            ))}
          </Grid>
        </section>

        <Cta />
      </div>
    </div>
  );
}
