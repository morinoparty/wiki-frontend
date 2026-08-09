"use client";

import { Image, type HagakiImageProps } from "hagaki/react";

/**
 * `hagaki/react` の `<Image>` をクライアント境界に閉じ込めるラッパ。
 *
 * `<Image>` は Context を使うクライアントコンポーネントなので、RSC 側の
 * モジュール (MDXRemoteComponents) から直接 import すると RSC のモジュール
 * グラフで評価されて `createContext is not a function` になる。
 */
export function ContentImage(props: HagakiImageProps) {
  return <Image {...props} />;
}

export type { HagakiImageProps };
