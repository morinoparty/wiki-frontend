import Link from "next/link";
import { Edit } from "lucide-react";
import { sva } from "styled-system/css";
import { Button } from "@/components/Button";
import { NotLoginNote } from "@/components/NotLoginNote";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/formatDateTime";
import { getPostsEditedBy } from "@/lib/getEditedPosts";
import { articleImageUrl } from "@/lib/hagaki";

const myEditedPosts = sva({
  slots: [
    "list",
    "row",
    "image",
    "body",
    "title",
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
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "nowrap",
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

/**
 * ログイン中のプレイヤーが編集に関わった記事の一覧。
 *
 * 編集履歴は生成物 `info.json` が正なので、投稿直後の記事は
 * wiki-content のデプロイが終わるまでここには出てこない。
 */
export async function MyEditedPosts() {
  const session = await getSession();
  const playerId = session?.user?.id;

  if (!playerId) {
    return <NotLoginNote />;
  }

  const styles = myEditedPosts();
  const editedPosts = await getPostsEditedBy(playerId);

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
            src={
              post.thumbnail
                ? articleImageUrl(post.uuid, post.thumbnail.imageId)
                : "/assets/placeholder.svg"
            }
            alt={post.title}
            className={styles.image}
          />
          <div className={styles.body}>
            <h3 className={styles.title}>{post.title}</h3>
            <p className={styles.meta}>
              最終編集 {formatDateTime(lastEditedAt)} ・ {edits}回編集
            </p>
          </div>
          <div className={styles.actions}>
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/dashboard/posts/${post.uuid}`}>
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
