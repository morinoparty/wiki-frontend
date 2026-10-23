import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { sva } from "styled-system/css";

/**
 * 記事本文の画像を拡大表示 (ライトボックス) するための見た目。
 * 背景を暗くぼかし、画像を画面いっぱいに収まる大きさで中央に置く。
 */
export const imageLightboxStyles = sva({
  slots: ["trigger", "backdrop", "positioner", "content", "close", "image"],
  base: {
    // 本文中の画像をそのままクリック対象にする。ボタン既定の見た目は消し、
    // 元の画像と同じくインラインで流す (文中の画像や、同じ段落に並べた複数の画像を崩さない)
    trigger: {
      display: "inline-block",
      verticalAlign: "bottom",
      maxW: "full",
      p: "0",
      m: "0",
      bg: "transparent",
      border: "none",
      color: "inherit",
      font: "inherit",
      textAlign: "inherit",
      // 画像 (inline / inline-block) の下にできる行の隙間を消す
      lineHeight: "0",
      cursor: "zoom-in",
      transition: "opacity 0.2s ease",
      _hover: { opacity: 0.92 },
      _focusVisible: {
        outline: "2px solid",
        outlineColor: "border.interactive",
        outlineOffset: "2px",
        borderRadius: "8px",
      },
    },
    // サイトのヘッダーやサイドバー (z-index: 100) より手前に出す
    backdrop: {
      position: "fixed",
      inset: "0",
      zIndex: 1000,
      bg: "black/72",
      backdropFilter: "blur(10px)",
    },
    positioner: {
      position: "fixed",
      inset: "0",
      zIndex: 1001,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: "16px",
      cursor: "zoom-out",
    },
    content: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      maxW: "100%",
      maxH: "100%",
      bg: "transparent",
      outline: "none",
      lineHeight: "0",
    },
    close: {
      position: "fixed",
      top: "12px",
      right: "16px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      w: "40px",
      h: "40px",
      p: "0",
      bg: "transparent",
      color: "white",
      border: "none",
      cursor: "pointer",
      opacity: 0.8,
      transition: "opacity 0.2s ease, transform 0.2s ease",
      _hover: { opacity: 1, transform: "scale(1.08)" },
      _active: { transform: "scale(0.96)" },
      _focusVisible: {
        outline: "2px solid",
        outlineColor: "white",
        outlineOffset: "2px",
      },
    },
    // 拡大した画像は比率を保ったまま画面に収める (周囲に少し余白を残す)
    image: {
      display: "block",
      w: "auto",
      h: "auto",
      maxW: "calc(100vw - 32px)",
      maxH: "calc(100dvh - 32px)",
      objectFit: "contain",
      boxShadow: "2xl",
    },
  },
});

interface ImageLightboxProps {
  /** 本文中に表示するサムネイル (クリックで拡大する) */
  children: ReactNode;
  /**
   * 拡大表示する中身。`imageClassName` は画面に収めるためのクラス
   * (`<img>` に付ける想定)。開いている間だけ描画される。
   */
  renderEnlarged: (imageClassName: string) => ReactNode;
  /** 画像の説明。ボタンとダイアログのラベルに使う */
  alt?: string;
}

/**
 * 画像をクリックすると拡大表示し、どこかをもう一度クリック (または Esc) すると閉じる。
 *
 * トリガーは `<button>` なので、Markdown で `<p>` の中に置かれても正しい入れ子のまま
 * (button は phrasing content)。中身にも `<div>` を入れないこと。
 * ダイアログは開いたときだけ Portal で body 直下に描画するため、SSR の HTML には含まれない。
 */
export function ImageLightbox({ children, renderEnlarged, alt }: ImageLightboxProps) {
  const styles = imageLightboxStyles();
  const label = alt ? `画像を拡大: ${alt}` : "画像を拡大";

  return (
    <Dialog.Root lazyMount unmountOnExit>
      <Dialog.Trigger className={styles.trigger} aria-label={label}>
        {children}
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        {/* 背景・画像のどこをクリックしても閉じる (写真ギャラリーと同じ挙動) */}
        <Dialog.Context>
          {(dialog) => (
            <Dialog.Positioner
              className={styles.positioner}
              onClick={() => dialog.setOpen(false)}
            >
              <Dialog.Content
                className={styles.content}
                aria-label={alt || "拡大した画像"}
              >
                <Dialog.CloseTrigger
                  className={styles.close}
                  aria-label="拡大表示を閉じる"
                >
                  <X size={20} />
                </Dialog.CloseTrigger>
                {renderEnlarged(styles.image ?? "")}
              </Dialog.Content>
            </Dialog.Positioner>
          )}
        </Dialog.Context>
      </Portal>
    </Dialog.Root>
  );
}
