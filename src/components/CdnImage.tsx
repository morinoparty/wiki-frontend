import type { CSSProperties, ComponentProps } from "react";

/**
 * Cloudflare Image Resizing (`/cdn-cgi/image/...`) を直接使う軽量イメージ。
 *
 * 旧実装は next/image + カスタム loader (src/lib/image-loader.ts) だったが、
 * vinext は `images.loaderFile` を無視し、`loader` prop も fill 時に width=0 を
 * 渡すバグがある (cloudflare/vinext#2699)。素の <img> + srcSet を自前で
 * 組み立てることで Next ビルド / vinext ビルドの両方で同一挙動になる。
 *
 * - 開発時 (NODE_ENV=development) は旧 loader と同じく元 URL をそのまま使う。
 * - `fill` は next/image と同じく absolute 配置で親を覆う。
 * - `priority` は loading="eager" + fetchPriority="high" に対応させる。
 */

const normalizeSrc = (src: string) => {
  return src.startsWith("/") ? src.slice(1) : src;
};

const cdnUrl = (src: string, width: number, quality?: number) => {
  const params = [`width=${width}`];
  if (quality) {
    params.push(`quality=${quality}`);
  }
  return `/cdn-cgi/image/${params.join(",")}/${normalizeSrc(src)}`;
};

/** next/image の deviceSizes 既定値 (fill / sizes 指定時の srcSet 候補幅)。 */
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

type CdnImageProps = Omit<
  ComponentProps<"img">,
  "src" | "srcSet" | "width" | "height"
> & {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** 親要素を覆う (next/image の fill 相当)。親は position: relative であること。 */
  fill?: boolean;
  /** LCP 画像向け: 遅延読み込みを無効化し fetchPriority を上げる。 */
  priority?: boolean;
  /** Cloudflare Image Resizing の quality パラメータ。 */
  quality?: number;
};

export function CdnImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality,
  sizes,
  style,
  loading,
  ...rest
}: CdnImageProps) {
  const isDev = process.env.NODE_ENV === "development";

  const fillStyle: CSSProperties | undefined = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }
    : style;

  let resolvedSrc = src;
  let srcSet: string | undefined;

  if (!isDev) {
    if (fill || sizes) {
      // レスポンシブ: deviceSizes 全幅の w ディスクリプタ。
      srcSet = DEVICE_SIZES.map(
        (w) => `${cdnUrl(src, w, quality)} ${w}w`,
      ).join(", ");
      resolvedSrc = cdnUrl(src, DEVICE_SIZES[DEVICE_SIZES.length - 1], quality);
    } else if (width) {
      // 固定幅: 1x / 2x ディスクリプタ (next/image の固定サイズ挙動)。
      srcSet = `${cdnUrl(src, width, quality)} 1x, ${cdnUrl(src, width * 2, quality)} 2x`;
      resolvedSrc = cdnUrl(src, width * 2, quality);
    }
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={fill || sizes ? (sizes ?? "100vw") : undefined}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      style={fillStyle}
      loading={priority ? "eager" : (loading ?? "lazy")}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      {...rest}
    />
  );
}
