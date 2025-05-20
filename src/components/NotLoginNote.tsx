import { css } from "styled-system/css";
import { Button } from "@/components/Button";
import { signIn } from "@/lib/auth";
import Link from "next/link";

export const NotLoginNote = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("MineAuth", { redirectTo: "/" });
      }}
      className={css({
        background: "#fff",
        borderRadius: "18px",
        padding: "20px",
        maxWidth: "320px",
        boxShadow: "0 2px 8px 0 #eaf2ef",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        alignItems: "center",
        width: "calc(100% + 34px)",
        ml: "-22px",
      })}
    >
      <div
        className={css({
          color: "leaf.600",
        })}
      >
        <div
          className={css({
            textStyle: "body",
            mb: "10px",
            fontWeight: "bold",
          })}
        >
          ログインしてWikiを
          <br />
          始めましょう！
        </div>
        <div
          className={css({
            textStyle: "body",
            fontSize: "12px",
          })}
        >
          もりぱアカウントにログインすると、Wikiへ書き込んだり、新しいページを作ったりできます。早速初めてみましょう！
        </div>
      </div>
      <div
        className={css({
          display: "flex",
          justifyContent: "center",
          width: "100%",
        })}
      >
        <Button
          // type="submit"
          style={{
            background: "#cdebdf",
            color: "#347e5e",
            fontWeight: 700,
            fontSize: "14px",
            borderRadius: "10px",
            padding: "0 32px",
            height: "40px",
            width: "100%",
          }}
          asChild
        >
          <Link href="/auth/sign-in">ログイン</Link>
        </Button>
      </div>
    </form>
  );
};
