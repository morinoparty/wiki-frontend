import { sva } from "styled-system/css";
import { Link } from "@tanstack/react-router";
import { Button } from "@morinoparty/chlorophyll-react/components";
import { ChevronLeft } from "lucide-react";
import { buttonSize } from "@/components/buttonSize";

const editorNavStyles = sva({
  slots: ["nav", "title"],
  base: {
    nav: {
      position: "sticky",
      top: 0,
      zIndex: 10,
      width: "100%",
      height: "64px",
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      justifyContent: "space-between",
      px: {
        base: "32px",
        lgDown: "12px",
      },
      backgroundColor: "white",
      textStyle: "body",
    },
    title: {
      textStyle: "body",
      color: "colorPalette.fg",
      fontWeight: "bold",
    },
  },
});

interface EditorNavProps {
  title: string;
  children?: React.ReactNode;
}

export function EditorNav({ title, children }: EditorNavProps) {
  const styles = editorNavStyles();
  return (
    <nav className={styles.nav}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {/* ツールバーの補助操作なので plain の sm。並び・文字サイズ・アイコンの大きさはレシピに任せる */}
        <Button asChild intent="plain" size="sm" className={buttonSize({ size: "sm" })}>
          <Link to="/dashboard">
            <ChevronLeft />
            戻る
          </Link>
        </Button>
      </div>
      <div>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "end",
          gap: "4px",
        }}
      >
        {children}
      </div>
    </nav>
  );
}
