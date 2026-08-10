import { css } from "styled-system/css";
import { MyEditedPosts } from "./components/MyEditedPosts";

export default async function Home() {
  return (
    <div
      className={css({
        px: {
          base: "90px",
          lgDown: "24px",
        },
        pt: "48px",
        pb: "128px",
      })}
    >
      <header
        className={css({
          mb: "32px",
        })}
      >
        <h1
          className={css({
            textStyle: "heading1",
            color: "colorPalette.fg",
            mb: "8px",
          })}
        >
          編集した記事
        </h1>
        <p
          className={css({
            textStyle: "body",
            color: "colorPalette.fg.subtle",
          })}
        >
          あなたが編集に関わった記事の一覧です。
        </p>
      </header>

      <main>
        <MyEditedPosts />
      </main>
    </div>
  );
}
