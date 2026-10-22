import { css } from "styled-system/css";
import { Button } from "@morinoparty/chlorophyll-react/components";
import { startSignIn } from "@/server/auth";

export const LoginModal: React.FC = () => {
  return (
    <form
      action={startSignIn}
      className={css({
        // ModalDialog.Container と同じパネルの面を使う
        bg: "bg.panel",
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
            color: "colorPalette.fg",
            mb: "20px",
          })}
        >
          もりぱうぃきにログイン
        </h2>
        <p
          className={css({
            textStyle: "body",
            color: "colorPalette.fg",
            mb: "42px",
          })}
        >
          もりのパーティへ参加している方は、もりぱアカウントのセットアップをすることで、すぐにWikiを編集することができます。
        </p>

        {/* フォームを送信する主操作。chlorophyll の Button は type を付けないため submit を明示する */}
        <Button type="submit" intent="primary" size="lg">もりぱアカウントでログイン</Button>
      </div>
    </form>
  );
};
