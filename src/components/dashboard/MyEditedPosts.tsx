import { Button, Card } from "@morinoparty/chlorophyll-react/components";
import { Link } from "@tanstack/react-router";
import { Edit } from "lucide-react";
import { css, sva } from "styled-system/css";
import { PostStatusBadge } from "@/components/dashboard/PostStatusBadge";
import { NotLoginNote } from "@/components/NotLoginNote";
import { formatDateTime } from "@/lib/formatDateTime";
import { articleImageUrl } from "@/lib/content";
import type {
  DashboardEditedPost,
  DashboardPost,
} from "@/lib/getDashboardPosts";

const myEditedPosts = sva({
  slots: [
    "list",
    "row",
    "image",
    "body",
    "title",
    "meta",
    "actions",
  ],
  base: {
    list: {
      display: "grid",
      gridTemplateColumns: "100px 1fr auto",
      bg: "bg.panel",
      padding: "16px",
      borderRadius: "24px",
    },
    row: {
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
    },
    image: {
      display: "block",
      borderRadius: "12px",
      aspectRatio: "1/1",
      objectFit: "cover",
      objectPosition: "center",
    },
    body: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      overflow: "hidden",
    },
    title: {
      textStyle: "body",
      color: "colorPalette.fg",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      overflow: "hidden",
    },
    meta: {
      textStyle: "body",
      fontSize: "14px",
      color: "colorPalette.fg.subtle",
    },
    actions: {
      display: "flex",
      alignItems: "center",
      justifyContent: "end",
    },
  },
});

/** CDN に無い記事 (draft / デプロイ待ち) のサムネイルはリポジトリ経由で読む。 */
function thumbnailSrc(post: DashboardPost): string {
  if (!post.thumbnail) return "/assets/placeholder.svg";
  if (post.draft || post.unpublished) {
    return `/api/article-assets/${post.uuid}/${post.thumbnail.imageId}${
      post.draft ? "?draft=1" : ""
    }`;
  }
  return articleImageUrl(post.uuid, post.thumbnail.imageId);
}

/**
 * ログイン中のプレイヤーが編集に関わった記事の一覧。
 *
 * 公開記事は生成物 `article.json` の `editors`、draft / デプロイ待ちの
 * 記事はリポジトリのコミット履歴から判定する。
 */
export function MyEditedPosts({
  editedPosts,
}: {
  /** 未ログインなら null。 */
  editedPosts: DashboardEditedPost[] | null;
}) {
  if (!editedPosts) {
    return <NotLoginNote />;
  }

  if (editedPosts.length === 0) {
    return (
      <Card.Root variant="elevated">
        <Card.Body>
          <p>まだ編集した記事がありません。気になるページを編集してみましょう。</p>
        </Card.Body>
      </Card.Root>
    );
  }

  const styles = myEditedPosts();

  return (
    <div className={styles.list}>
      {editedPosts.map(({ post, edits, lastEditedAt }) => (
        <div key={post.uuid} className={styles.row}>
          <img
            src={thumbnailSrc(post)}
            alt={post.title}
            className={styles.image}
          />
          <div className={styles.body}>
            <h3 className={styles.title}>
              <span
                className={css({
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                })}
              >
                {post.title || "(無題)"}
              </span>
              <PostStatusBadge
                draft={post.draft}
                unpublished={post.unpublished}
              />
            </h3>
            <p className={styles.meta}>
              最終編集 {formatDateTime(lastEditedAt)} ・ {edits}回編集
            </p>
          </div>
          <div className={styles.actions}>
            {/* 一覧の行ごとの操作なので plain の sm で控えめにする */}
            <Button asChild intent="plain" size="sm">
              <Link to="/dashboard/posts/$postId" params={{ postId: post.uuid }}>
                <Edit />
                編集
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
