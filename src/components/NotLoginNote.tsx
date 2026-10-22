import { css } from "styled-system/css";
import { Button } from "@morinoparty/chlorophyll-react/components";
import { startSignIn } from "@/server/auth";
import { Link } from "@tanstack/react-router";

export const NotLoginNote = () => {
  return (
    <form
      action={startSignIn}
      className={css({
        background: "bg.panel",
        borderRadius: "18px",
        padding: "20px",
        maxWidth: "320px",
        boxShadow: "sm",
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
          color: "colorPalette.fg",
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
        {/*
          ログインへの主導線なので primary にする (secondary は bg.panel でカードの地と同化するため使わない)。
          リンクで遷移するだけなのでフォームの送信ボタンにはならない (asChild で <a> を描く)。幅だけカードに合わせて広げる
        */}
        <Button
          asChild
          intent="primary"
          size="md"
          className={css({ width: "100%" })}
        >
          <Link to="/auth/sign-in">ログイン</Link>
        </Button>
      </div>
    </form>
  );
};
