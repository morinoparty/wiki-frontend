import { Link } from "@tanstack/react-router";
import { Edit } from "lucide-react";
import { css, cx, sva } from "styled-system/css";
import { Button } from "@/components/Button";
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
    "badge",
    "meta",
    "actions",
    "empty",
    "emptyText",
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
    badge: {
      fontSize: "xs",
      fontWeight: "normal",
      color: "colorPalette.fg",
      borderRadius: "full",
      px: "8px",
      py: "2px",
      flexShrink: 0,
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
    empty: {
      bg: "bg.panel",
      padding: "24px",
      borderRadius: "24px",
    },
    emptyText: {
      textStyle: "body",
      color: "colorPalette.fg.subtle",
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

  const styles = myEditedPosts();

  if (editedPosts.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>
          まだ編集した記事がありません。気になるページを編集してみましょう。
        </p>
      </div>
    );
  }

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
              {post.draft ? (
                <span className={cx(styles.badge, css({ bg: "gray.200" }))}>
                  下書き
                </span>
              ) : post.unpublished ? (
                <span className={cx(styles.badge, css({ bg: "amber.200" }))}>
                  配信待ち
                </span>
              ) : null}
            </h3>
            <p className={styles.meta}>
              最終編集 {formatDateTime(lastEditedAt)} ・ {edits}回編集
            </p>
          </div>
          <div className={styles.actions}>
            <Button size="sm" variant="ghost" asChild>
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
