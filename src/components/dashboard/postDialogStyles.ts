import { sva } from "styled-system/css";

/**
 * 記事の新規作成ダイアログ (1/2 カテゴリ選択、2/2 入力フォーム) で共通の枠まわり。
 *
 * ModalDialog の hasMainPadding は gridTemplate (shorthand) だけを差し替えるため、
 * 左右の余白列 (gridTemplateColumns) まで消えて中身が枠に貼り付いてしまう。
 * そこで hasMainPadding は使わず、行と列の幅をこちらで指定し、
 * Content は端まで伸ばしたまま内側の余白で title / footer と左端を揃える。
 */
export const postDialogStyles = sva({
  slots: ["container", "subtitle", "heading", "main", "footerNote"],
  base: {
    container: {
      // recipe の grid-template-areas はそのまま使い、行と列の幅だけ上書きする
      gridTemplateColumns: "40px 1fr 40px",
      gridTemplateRows: "40px auto 24px auto 20px auto 28px",
    },
    subtitle: {
      fontSize: "14px",
      fontWeight: "bold",
      color: "colorPalette.fg.subtle",
    },
    heading: {
      textStyle: "heading2",
      fontSize: "24px",
      color: "colorPalette.fg",
    },
    // ModalDialog.Content に当てる。上下を同じ色の区切り線で挟み、左右は title / footer と同じ 40px
    main: {
      px: "40px",
      py: "24px",
      // borderBottom の shorthand が borderColor より後に出力され下線だけ文字色になるため、
      // 色は辺ごとの longhand で指定する
      borderTop: "1px solid",
      borderBottom: "1px solid",
      borderTopColor: "border.subtle",
      borderBottomColor: "border.subtle",
    },
    // footer で主操作の横に添える一言
    footerNote: {
      fontSize: "14px",
      fontWeight: "bold",
      color: "colorPalette.fg.subtle",
    },
  },
});
