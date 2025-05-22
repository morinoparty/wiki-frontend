import { css } from "styled-system/css";
import { Button } from "./Button";
import Link from "next/link";

export const Cta: React.FC = () => {
  return (
    <section
      className={css({
        borderRadius: "32px",
        bg: "white",
        p: "24px",
        pt: { base: "none", lgDown: "48px" },
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
          lgDown: "52px",
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
          p: { base: "24px", lgDown: "0" },
        })}
      >
        <h2
          className={css({
            textStyle: "heading1",
            color: "leaf.600",
            mb: "20px",
          })}
        >
          もりのパーティで、
          <br />
          あなたを待っています
        </h2>
        <p
          className={css({
            textStyle: "body",
            color: "leaf.600",
            mb: {
              base: "64px",
              lgDown: "48px",
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
          borderRadius: "10px",
          order: {
            base: 1,
            lgDown: 0,
          },
          aspectRatio: {
            base: "inherit",
            lgDown: "3/2",
          },
        })}
      ></div>
    </section>
  );
};
