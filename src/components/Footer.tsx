import Link from "next/link";
import { sva } from "styled-system/css";
import { FooterLinkItem } from "./FooterLinkItem";

const footerStyles = sva({
  slots: ["root", "logo", "description", "list", "copyright"],
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
      borderColor: "leaf.200",
    },
    logo: {},
    description: {
      textStyle: "body",
      fontSize: "14px",
      color: "leaf.600/50",
      mt: "24px",
    },
    list: {
      listStyle: "none",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      textAlign: "left",
      color: "leaf.500",
    },
    copyright: {
      textStyle: "copyright",
      textAlign: "left",
      color: "leaf.600",
      gridColumn: "1 / -1",
      mt: {
        base: "0",
        lgDown: "48px",
      },
    },
  },
});

export function Footer() {
  const styles = footerStyles();
  return (
    <footer className={styles.root}>
      <div>
        <Link href="/">
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
