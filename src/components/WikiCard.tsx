import { sva } from "styled-system/css";
import Link from "next/link";
import { WikiPost } from "@/types/wiki";
import Image from "next/image";
import cloudflareLoader from "@/lib/image-loader";

const wikiCardStyles = sva({
  slots: [
    "card",
    "container",
    "title",
    "description",
    "date",
    "category",
    "image",
  ],
  base: {
    card: {
      display: "grid",
      gridTemplateRows: "auto auto",
      gap: "20px",
      width: "100%",
      height: "fit-content",
      overflow: "hidden",
    },
    container: {
      overflow: "hidden",
    },
    title: {
      height: "fit-content",
      fontSize: "18px",
      fontWeight: "bold",
      textStyle: "button",
      color: "leaf.700",
    },
    description: {
      textStyle: "body",
      fontSize: "14px",
      mt: "0.4vh",
      color: "leaf.700/50",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    image: {
      width: "100%",
      aspectRatio: "16/9",
      height: "fit-content",
      borderRadius: "10px",
      bg: "leaf.200",
      objectFit: "cover",
      objectPosition: "center",
    },
  },
});

export default function WikiCard({ post }: { post: WikiPost }) {
  const styles = wikiCardStyles();
  const link =
    // 全てを小文字に変換
    post.slug.toLowerCase();

  return (
    <Link href={`/${link}`}>
      <article className={styles.card}>
        <Image
          className={styles.image}
          src={
            post.image
              ? "https://wiki-contentdev.yahiro.workers.dev/" + post.image
              : "/assets/placeholder.svg"
          }
          alt={post.title}
          width={800}
          height={600}
          loading="lazy"
          loader={cloudflareLoader}
        />

        <div className={styles.container}>
          <h2 className={styles.title}>{post.title}</h2>
          <p className={styles.description}>{post.description}</p>
        </div>
      </article>
    </Link>
  );
}
