import { css } from "styled-system/css";
import { Button } from "@morinoparty/chlorophyll-react/components";
import { startSignIn } from "@/server/auth";
import { buttonSize } from "@/components/buttonSize";

export const NotLoginNote = () => {
  return (
    <form
      // ログイン後はこのページに戻る
      action={() => startSignIn()}
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
          サインインページを経由せず、フォームの送信で直接 MineAuth へ遷移する。
          chlorophyll の Button は type を付けないため submit を明示する。幅だけカードに合わせて広げる
        */}
        <Button
          type="submit"
          intent="primary"
          size="md"
          className={css(buttonSize.raw({ size: "md" }), { width: "100%" })}
        >
          ログイン
        </Button>
      </div>
    </form>
  );
};
