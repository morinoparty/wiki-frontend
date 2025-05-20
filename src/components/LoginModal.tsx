import { css } from "styled-system/css";
import { Button } from "./Button";
import { signIn } from "@/lib/auth";

export const LoginModal: React.FC = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("MineAuth", { redirectTo: "/" });
      }}
      className={css({
        background: "#fff",
        display: "grid",
        gridTemplateRows: "362px auto",
        maxWidth: "520px",
        borderRadius: "32px",
        overflow: "hidden",
      })}
    >
      <div
        className={css({
          width: "100%",
          backgroundImage: "url('/assets/top-header.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        })}
      />
      <div
        className={css({
          px: "38px",
          pt: "32px",
          pb: "38px",
        })}
      >
        <h2
          className={css({
            textStyle: "heading2",
            color: "leaf.600",
            mb: "20px",
          })}
        >
          もりぱうぃきにログイン
        </h2>
        <p
          className={css({
            textStyle: "body",
            color: "leaf.600",
            mb: "42px",
          })}
        >
          もりのパーティへ参加している方は、もりぱアカウントのセットアップをすることで、すぐにWikiを編集することができます。
        </p>

        <Button type="submit">もりぱアカウントでログイン</Button>
      </div>
    </form>
  );
};
