import { Button } from "@morinoparty/chlorophyll-react/components";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { sva } from "styled-system/css";
import { EditorNav } from "@/components/EditorNav";
import { buttonSize } from "@/components/buttonSize";

const postForbiddenStyles = sva({
  slots: ["container", "icon", "content", "title", "description"],
  base: {
    container: {
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "24px",
      px: { base: "90px", lgDown: "24px" },
    },
    icon: {
      color: "colorPalette.fg.subtle",
    },
    content: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      maxWidth: "480px",
      textAlign: "center",
    },
    title: {
      textStyle: "heading2",
      fontWeight: "bold",
      color: "colorPalette.fg",
    },
    description: {
      textStyle: "body",
      color: "colorPalette.fg",
      lineHeight: "1.6",
    },
  },
});

/**
 * 編集する権限が無い記事を開いたときに、エディタの代わりに出す案内。
 * 記事のタイトルなどは出さない (他人の下書きの中身を漏らさないため)。
 */
export function PostForbidden() {
  const classes = postForbiddenStyles();
  return (
    <div>
      <EditorNav title="ページの編集" />
      <div className={classes.container}>
        <Lock size={64} strokeWidth={1.25} className={classes.icon} />
        <div className={classes.content}>
          <h1 className={classes.title}>この記事を編集する権限がありません</h1>
          <p className={classes.description}>
            下書きは作成者と編集者に指定されたプレイヤーだけが、
            編集者が指定された記事はそのプレイヤーだけが編集できます。
            <br />
            作成したばかりの下書きは、少し待ってから再読み込みしてください。
            スタッフ権限を付与されたばかりの場合は、ログインし直してください。
          </p>
        </div>
        <Button asChild intent="primary" size="lg" className={buttonSize({ size: "md" })}>
          <Link to="/dashboard/posts">投稿一覧に戻る</Link>
        </Button>
      </div>
    </div>
  );
}
