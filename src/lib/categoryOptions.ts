import type {
  CategoryOptionEnumValue,
  CategoryOptionField,
  PostOptionValues,
  WikiCategory,
} from "@/types/wiki";

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

/** カテゴリが宣言している enum フィールド 1 つ分。キーは frontmatter の `option.<key>`。 */
export interface EnumOptionField {
  key: string;
  field: CategoryOptionField;
  /** 宣言された選択肢。id が保存される値、display が表示名。 */
  values: CategoryOptionEnumValue[];
}

/**
 * カテゴリが宣言している enum フィールドを列挙する。
 *
 * 選択肢が無い宣言は入力欄として成立しないので落とす。
 */
export function enumOptionFields(category: CategoryLike): EnumOptionField[] {
  return Object.entries(category?.option ?? {}).flatMap(([key, field]) => {
    if (field.type !== "enum") return [];
    const values = field.enum ?? [];
    return values.length > 0 ? [{ key, field, values }] : [];
  });
}

/** 値が宣言された型に合っているか。 */
function matchesType(field: CategoryOptionField, value: unknown): boolean {
  switch (field.type) {
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "enum":
      // 保存されるのは選択肢の id。宣言に無い値は受け付けない
      return (
        typeof value === "string" &&
        (field.enum ?? []).some((choice) => choice.id === value)
      );
    case "string":
      return typeof value === "string";
  }
}

/**
 * 新規記事の option の初期値。宣言に `default` があり、かつその型
 * （enum なら選択肢の id）に合っていればそれを入れる。無ければ未入力。
 */
export function defaultOptionValues(category: CategoryLike): PostOptionValues {
  const values: PostOptionValues = {};
  for (const [key, field] of Object.entries(category?.option ?? {})) {
    const fallback = field.default;
    if (fallback !== undefined && matchesType(field, fallback)) {
      values[key] = fallback;
    }
  }
  return values;
}

/**
 * 記事が持つ option の値が、カテゴリの宣言と噛み合っているか検証する。
 * 問題があればエラーメッセージを、無ければ null を返す。
 */
export function validateOptionValues(
  category: CategoryLike,
  option: PostOptionValues | undefined
): string | null {
  for (const [key, field] of Object.entries(category?.option ?? {})) {
    const value = option?.[key];
    const label = field.label ?? key;
    if (value === undefined || value === "") {
      if (field.required) return `${label}を入力してください`;
      continue;
    }
    if (!matchesType(field, value)) {
      return field.type === "enum"
        ? `${label}に選べない値が指定されています`
        : `${label}の形式が正しくありません`;
    }
  }
  return null;
}

/** 座標の入力欄に出すプレースホルダー。 */
export function positionPlaceholder(
  category: CategoryLike,
  key: PositionKey
): string {
  const placeholder = getOptionField(category, key)?.placeholder;
  return placeholder ? `例: ${placeholder}` : "";
}
