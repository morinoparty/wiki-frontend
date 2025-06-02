"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface HideOnPathProps {
  children: ReactNode;
  hidePaths: string | string[];
  exactMatch?: boolean;
}

/**
 * 特定のURLパスで子要素を非表示にするコンポーネント
 *
 * @param children - 表示/非表示を切り替える子要素
 * @param hidePaths - 非表示にするパス（文字列または文字列配列）
 * @param exactMatch - 完全一致で判定するか（デフォルト: false、部分一致）
 */
export const HideOnPath: React.FC<HideOnPathProps> = ({
  children,
  hidePaths,
  exactMatch = false,
}) => {
  const pathname = usePathname();

  const pathsArray = Array.isArray(hidePaths) ? hidePaths : [hidePaths];

  const shouldHide = pathsArray.some((path) => {
    if (exactMatch) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  });

  if (shouldHide) {
    return null;
  }

  return <>{children}</>;
};
