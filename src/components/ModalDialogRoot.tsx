import {
  ModalDialog,
  type ModalDialogRootProps,
} from "@morinoparty/chlorophyll-react/components";

/**
 * `ModalDialog.Root` をクライアント境界の内側で解決するための薄いラッパー。
 *
 * chlorophyll の ModalDialog は `Object.assign` で組んだ複合コンポーネントなので、
 * Server Component から `ModalDialog.Root` とドット参照すると
 * client reference proxy が `Root` という名前の export を探して undefined になる。
 * ページ側はこのコンポーネントを使う。
 */
export const ModalDialogRoot = (props: ModalDialogRootProps) => {
  return <ModalDialog.Root {...props} />;
};
