import { Button } from "@/components/Button";
import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { SidebarContentNormal } from "@/components/SidebarContent";
import { TentTree } from "lucide-react";
import Link from "next/link";
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
      color: "leaf.500",
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
      color: "leaf.700",
    },
    subtitle: {
      textStyle: "heading2",
      fontSize: {
        base: "24px",
        mdDown: "20px",
      },
      fontWeight: "600",
      color: "leaf.600",
      mb: "8px",
    },
    description: {
      textStyle: "body",
      color: "leaf.600",
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

export default function NotFound() {
  const classes = notFoundPageStyles();

  return (
    <Layout
      sidebar={
        <Sidebar>
          <SidebarContentNormal />
        </Sidebar>
      }
    >
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
            <Link href="/">トップページに戻る</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/category">カテゴリ一覧</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
