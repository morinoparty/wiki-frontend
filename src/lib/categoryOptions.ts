import type { CategoryOptionField, WikiCategory } from "@/types/wiki";

/**
 * 座標付きカテゴリが宣言する option のキー。
 *
 * hagaki のカテゴリは「記事が追加で持つ frontmatter のフィールド」を
 * `option` で宣言するだけで、その意味には関知しない。
 * このアプリでは x / y が整数で宣言されているカテゴリを
 * 「座標を持つカテゴリ」(旧 `hasPosition`) として扱う。
 */
export const POSITION_KEYS = ["x", "y"] as const;

export type PositionKey = (typeof POSITION_KEYS)[number];

type CategoryLike = Pick<WikiCategory, "option"> | undefined | null;

/** カテゴリが宣言している option フィールドを 1 つ取り出す。 */
export function getOptionField(
  category: CategoryLike,
  key: string
): CategoryOptionField | undefined {
  return category?.option?.[key];
}

/** x / y が両方とも整数フィールドとして宣言されているカテゴリか。 */
export function hasPositionOption(category: CategoryLike): boolean {
  return POSITION_KEYS.every(
    (key) => getOptionField(category, key)?.type === "integer"
  );
}


/** 座標の入力欄に出すラベル。カテゴリ側の宣言が無ければ既定の日本語ラベル。 */
export function positionLabel(category: CategoryLike, key: PositionKey): string {
  return getOptionField(category, key)?.label ?? `${key.toUpperCase()}座標`;
}

/** 座標の入力欄に出すプレースホルダー。 */
export function positionPlaceholder(
  category: CategoryLike,
  key: PositionKey
): string {
  const placeholder = getOptionField(category, key)?.placeholder;
  return placeholder ? `例: ${placeholder}` : "";
}
