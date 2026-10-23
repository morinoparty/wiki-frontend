import { Image, type HagakiImageProps } from "@morinoparty/hagaki/react";
import type { CSSProperties } from "react";
import { ImageLightbox } from "@/components/ImageLightbox";

/** 拡大表示で画面の端に残す余白 (ImageLightbox の image スロットと揃える) */
const VIEWPORT_MAX_WIDTH = "calc(100vw - 32px)";
const VIEWPORT_MAX_HEIGHT = "calc(100dvh - 32px)";

/**
 * MDX の width / height (文字列のこともある) を正の整数に直す。
 * 解釈できないときは undefined を返す。
 */
function toDimension(value: number | string | undefined): number | undefined {
  if (value == null) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

/**
 * 拡大表示用の hagaki `<Image>` のインラインスタイル。
 *
 * hagaki の `<Image>` はラッパーの `<span>` に `width: <幅>px` と `maxWidth: 100%` を
 * インラインで付けるため、クラスでは上書きできない。`style` で幅を差し替え、
 * 縦横比を保ったまま画面に収まる幅 (横の上限・縦の上限から逆算した幅の小さい方) にする。
 */
function enlargedStyle(props: HagakiImageProps): CSSProperties {
  const width = toDimension(props.width);
  const height = toDimension(props.height);
  const base: CSSProperties = {
    maxWidth: VIEWPORT_MAX_WIDTH,
    maxHeight: VIEWPORT_MAX_HEIGHT,
  };
  if (width == null || height == null) return base;
  return {
    ...base,
    width: `min(${width}px, ${VIEWPORT_MAX_WIDTH}, calc(${VIEWPORT_MAX_HEIGHT} * ${width} / ${height}))`,
  };
}

/**
 * `hagaki/react` の `<Image>` のラッパ。本文中の `<Image imageId="…" />` を
 * 描画する。URL 解決は `<ContentImageConfig>` が供給する。
 *
 * クリックすると同じ画像を拡大表示する。拡大側も hagaki の `<Image>` を使うので、
 * URL 解決 (articleId / urlFor のコンテキスト) とブラーハッシュのプレースホルダーはそのまま効く。
 */
export function ContentImage({
  enlargeable = true,
  ...props
}: HagakiImageProps & {
  /** false のときは拡大表示にしない (リンクの中の画像など) */
  enlargeable?: boolean;
}) {
  if (!enlargeable) return <Image {...props} />;
  const { className: _className, style: _style, ...imageProps } = props;
  return (
    <ImageLightbox
      alt={props.alt}
      renderEnlarged={(imageClassName) => (
        <Image
          {...imageProps}
          className={imageClassName}
          style={enlargedStyle(props)}
        />
      )}
    >
      <Image {...props} />
    </ImageLightbox>
  );
}

export type { HagakiImageProps };
