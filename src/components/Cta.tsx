import { css } from "styled-system/css";
import { Button } from "./Button";
import Link from "next/link";

export const Cta: React.FC = () => {
  return (
    <section
      className={css({
        borderRadius: "32px",
        overflow: "hidden",
        bg: "white",
        p: {
          base: "24px",
          lgDown: "0",
        },
        pt: { base: "none", lgDown: "40px" },
        display: "grid",
        gridTemplateColumns: {
          base: "1fr 1fr",
          lgDown: "1fr",
        },
        gridTemplateRows: {
          base: "1fr",
          lgDown: "auto 1fr",
        },
        gap: {
          base: "24px",
          lgDown: "32px",
        },
        width: {
          base: "calc(100% + 48px)",
          lgDown: "100%",
        },
        ml: {
          base: "-24px",
          lgDown: "0",
        },
      })}
    >
      <div
        className={css({
          p: {
            base: "24px 24px 24px 24px",
            lgDown: "0 24px 0 24px",
          },
        })}
      >
        <h2
          className={css({
            textStyle: "heading1",
            color: "colorPalette.fg",
            mb: {
              base: "20px",
              lgDown: "12px",
            },
            fontSize: {
              base: "28px",
              lgDown: "22px",
            },
          })}
        >
          もりのパーティで、
          <br />
          あなたを待っています
        </h2>
        <p
          className={css({
            textStyle: "body",
            color: "colorPalette.fg",
            mb: {
              base: "64px",
              lgDown: "32px",
            },
          })}
        >
          {`のんびり、ゆったり、気ままに、あそべる\nMinecraftサーバー「もりのパーティ」に参加してみませんか?`}
        </p>

        <Button asChild>
          <Link href="https://morino.party/">ちょっと入ってみる</Link>
        </Button>
      </div>

      <div
        className={css({
          backgroundImage: "url('/assets/top-community.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: {
            base: "10px",
            lgDown: "0",
          },
          order: {
            base: 1,
            lgDown: 0,
          },
          aspectRatio: {
            base: "inherit",
            lgDown: "3/2",
          },
          width: "100%",
        })}
      ></div>
    </section>
  );
};
