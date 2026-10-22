import { Badge } from "@morinoparty/chlorophyll-react/components";
import { css } from "styled-system/css";

/** 記事の公開状態を判定するのに必要な最小限のフィールド。 */
interface PostStatusBadgeProps {
  /** frontmatter の `draft: true`。 */
  draft?: boolean;
  /** コミット済みだが、まだ配信 (デプロイ) されていない記事。 */
  unpublished?: boolean;
}

// Badge は colorPalette prop を持たないため、className で palette を切り替える。
// panda は css() のリテラルを静的解析するので、ここで事前に生成しておく。
// flexShrink: 0 は、タイトルが省略表示される flex 行の中でバッジが潰れないようにするため。
const draftClassName = css({ colorPalette: "gray", flexShrink: 0 });
const unpublishedClassName = css({ colorPalette: "yellow", flexShrink: 0 });

/**
 * 記事の公開状態 (下書き / 配信待ち) を示すバッジ。
 * 公開済みの記事では何も表示しない。
 */
export function PostStatusBadge({ draft, unpublished }: PostStatusBadgeProps) {
  if (draft) {
    return (
      <Badge variant="subtle" size="sm" className={draftClassName}>
        下書き
      </Badge>
    );
  }
  if (unpublished) {
    return (
      <Badge variant="subtle" size="sm" className={unpublishedClassName}>
        配信待ち
      </Badge>
    );
  }
  return null;
}
