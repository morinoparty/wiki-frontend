import type {
  CategoryOptionEnumValue,
  CategoryOptionField,
  PostOptionValues,
  WikiCategory,
} from "@/types/wiki";

// hagaki のカテゴリは「記事が追加で持つ frontmatter のフィールド」を
// `option` で宣言するだけで、その意味には関知しない。
// ここではその宣言を入力欄・初期値・検証に使うための汎用的な処理だけを持つ
type CategoryLike = Pick<WikiCategory, "option"> | undefined | null;

/** カテゴリが宣言している option フィールドを 1 つ取り出す。 */
export function getOptionField(
  category: CategoryLike,
  key: string
): CategoryOptionField | undefined {
  return category?.option?.[key];
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
