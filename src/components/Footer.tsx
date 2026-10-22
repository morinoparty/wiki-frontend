import { Link } from "@tanstack/react-router";
import { sva } from "styled-system/css";
import { FooterLinkItem } from "./FooterLinkItem";

const footerStyles = sva({
  slots: ["root", "logo", "description", "list", "copyright", "license"],
  base: {
    root: {
      px: {
        base: "48px",
        lgDown: "24px",
      },
      pt: "56px",
      pb: {
        base: "48px",
        mdDown: "calc(80px + 48px)",
      },
      display: "grid",
      gridTemplateColumns: {
        base: "1fr 1fr 1fr",
        lgDown: "auto",
      },
      gap: {
        base: "86px 32px",
        lgDown: "32px 0",
      },
      borderTop: "1px solid",
      borderColor: "border.subtle",
    },
    logo: {},
    description: {
      textStyle: "body",
      fontSize: "14px",
      color: "colorPalette.fg.subtle",
      mt: "24px",
    },
    list: {
      listStyle: "none",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      textAlign: "left",
      color: "colorPalette.fg.subtle",
      "&:hover li:not(:hover)": {
        opacity: 0.5,
      },
      "& li": {
        transition: "opacity 0.2s ease",
      },
    },
    copyright: {
      textStyle: "copyright",
      textAlign: "left",
      color: "colorPalette.fg",
      gridColumn: {
        base: "1 / 3",
        lgDown: "1 / -1",
      },
      gridRow: {
        base: "2 / 3",
        // last row in lgDown
        lgDown: "5 / 6",
      },
      mt: {
        base: "0",
        lgDown: "48px",
      },
    },
    license: {
      textStyle: "body",
      color: "colorPalette.fg.subtle",
      fontSize: "14px",
      gridColumn: {
        base: "3 / -1",
        lgDown: "1 / -1",
      },
      alignSelf: "end",
      transition: "color 0.2s ease",
      _hover: {
        color: "colorPalette.fg.subtle",
      },
    },
  },
});

export function Footer() {
  const styles = footerStyles();
  return (
    <footer className={styles.root}>
      <div>
        <Link to="/">
          <img
            src={"/assets/logo.svg"}
            alt="MorinoParty"
            width={200}
            height={50}
            className={styles.logo}
          />
        </Link>
        <p className={styles.description}>
          もりのパーティ公式Wiki もりぱうぃき!
        </p>
      </div>

      <ul className={styles.list}>
        <FooterLinkItem href="/category">カテゴリ一覧</FooterLinkItem>
        <FooterLinkItem href="/guide">Wiki投稿ガイド</FooterLinkItem>
        <FooterLinkItem href="/guide">マークダウン記法について</FooterLinkItem>
      </ul>

      <ul className={styles.list}>
        <FooterLinkItem href="https://morino.party/" withIcon>
          もりのパーティ Webサイト
        </FooterLinkItem>
        <FooterLinkItem href="https://morino.party/first" withIcon>
          はじめての方へ
        </FooterLinkItem>
        <FooterLinkItem href="https://morino.party/guideline" withIcon>
          行動規約
        </FooterLinkItem>
      </ul>

      <ul className={styles.license}>
        <Link to="/license">オープンソースライセンス</Link>
      </ul>

      <p className={styles.copyright}>
        © morino.party
        <br />
        <span className={styles.description}>
          &quot;Minecraft&quot; is a trademark of Mojang Synergies AB
        </span>
      </p>
    </footer>
  );
}
