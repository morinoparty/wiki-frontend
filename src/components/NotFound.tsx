import { Button } from "@/components/Button";
import { TentTree } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { sva } from "styled-system/css";

const notFoundPageStyles = sva({
  slots: [
    "container",
    "icon",
    "content",
    "title",
    "subtitle",
    "description",
    "actions",
  ],
  base: {
    container: {
      width: "100%",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      px: {
        base: "90px",
        lgDown: "24px",
      },
      gap: "24px",
    },
    icon: {
      color: "colorPalette.fg.subtle",
    },
    content: {
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      maxWidth: "480px",
    },
    title: {
      textStyle: "heading1",
      fontSize: {
        base: "48px",
        mdDown: "36px",
      },
      fontWeight: "bold",
      color: "colorPalette.fg",
    },
    subtitle: {
      textStyle: "heading2",
      fontSize: {
        base: "24px",
        mdDown: "20px",
      },
      fontWeight: "600",
      color: "colorPalette.fg",
      mb: "8px",
    },
    description: {
      textStyle: "body",
      color: "colorPalette.fg",
      textAlign: "center",
      lineHeight: "1.6",
    },
    actions: {
      display: "flex",
      gap: "16px",
      flexWrap: "wrap",
      justifyContent: "center",
    },
  },
});

/**
 * 404 の中身。公開ページのレイアウト (`/_normal`) の内側で描画する。
 * 記事やカテゴリが見つからないときは各 loader が `notFound()` を投げ、
 * `/_normal` の notFoundComponent としてここが出る。
 */
export function NotFound() {
  const classes = notFoundPageStyles();

  return (
    <div className={classes.container}>
      <TentTree size={96} strokeWidth={1.25} className={classes.icon} />
      <div className={classes.content}>
        <h1 className={classes.title}>404</h1>
        <h2 className={classes.subtitle}>ページが見つかりません</h2>
        <p className={classes.description}>
          お探しのページは削除されたか、URLが変更された可能性があります。
          <br />
          Steveが持っていっちゃったかも...。
          <br />
          トップページから再度お探しください🍂
        </p>
      </div>
      <div className={classes.actions}>
        <Button asChild>
          <Link to="/">トップページに戻る</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/category">カテゴリ一覧</Link>
        </Button>
      </div>
    </div>
  );
}
