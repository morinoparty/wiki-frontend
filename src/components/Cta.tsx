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
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        width: "calc(100% + 48px)",
        ml: "-24px",
      })}
    >
      <div
        className={css({
          p: "24px",
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
            mb: "64px",
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
        })}
      ></div>
    </section>
  );
};
