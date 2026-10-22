import {
  Button,
  Field,
  ModalDialog,
  Portal,
  Select,
  createListCollection,
} from "@morinoparty/chlorophyll-react/components";
import { PostOptionValues, WikiCategory } from "@/types/wiki";
import type { PositionKey } from "@/lib/categoryOptions";
import {
  POSITION_KEYS,
  defaultOptionValues,
  enumOptionFields,
  hasPositionOption,
  positionLabel,
  positionPlaceholder,
  validateOptionValues,
} from "@/lib/categoryOptions";
import { useState, useEffect, useCallback, useMemo } from "react";
import { css, sva } from "styled-system/css";
import { buttonSize } from "@/components/buttonSize";
import { ChevronLeft } from "lucide-react";

// フォームの部品 (ラベル・入力欄・必須の印・補足/エラー) は chlorophyll の Field に任せ、
// ここではダイアログ内のレイアウトと見出しまわりだけを持つ
const postFormModalStyles = sva({
  slots: ["heading", "subtitle", "main", "urlRow", "urlPrefix", "successMessage"],
  base: {
    subtitle: {
      textStyle: "body",
      fontWeight: "bold",
      color: "colorPalette.fg.subtle",
      mb: "8px",
    },
    heading: {
      textStyle: "heading2",
      color: "colorPalette.fg",
      fontSize: "26px",
    },
    main: {
      // grid の配置は ModalDialog.Content が持つので、中身の縦積みと区切り線だけを書く
      display: "flex",
      flexDirection: "column",
      gap: "40px",
      py: "32px",
      borderTop: "1px solid",
      borderBottom: "1px solid",
      borderColor: "border.subtle",
    },
    urlRow: {
      // 「wiki.morino.party/」の固定部分と slug の入力欄を横に並べる
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    urlPrefix: {
      fontSize: "sm",
      fontWeight: "500",
      color: "fg.subtle",
      whiteSpace: "nowrap",
      flexShrink: 0,
    },
    successMessage: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "colorPalette.fg.subtle",
      lineHeight: "1.7",
      textAlign: "right",
      flex: 1,
    },
  },
});

/** このダイアログが集める記事の入力値。option の中身はカテゴリの宣言次第。 */
export interface PostFormValues {
  title: string;
  url: string;
  description: string;
  /**
   * カテゴリが option で宣言したフィールドの値。座標もここに入り、enum は
   * 選択肢の id を入れる（記事の frontmatter `option.<key>` に保存される）。
   */
  option?: PostOptionValues;
}

type SlugCheckStatus =
  | "idle"
  | "checking"
  | "available"
  | "duplicate"
  | "error";

export const DashboardPostFormModal: React.FC<{
  selectedCategory: string;
  categories: WikiCategory[];
  existingSlugs: string[];
  /**
   * 前の段階 (カテゴリ選択) に戻る。入力中の値を渡すので、呼び出し側で保持しておけば
   * 次に進み直したときに `initialValues` で復元できる
   */
  onBack: (values: PostFormValues) => void;
  onSubmit: (data: PostFormValues) => void;
  /** 戻る前に入力していた値。カテゴリを選び直した場合、option は呼び出し側で捨てる */
  initialValues?: Partial<PostFormValues>;
}> = ({
  selectedCategory,
  categories,
  existingSlugs,
  onBack,
  onSubmit,
  initialValues,
}) => {
  // 選択されたカテゴリの情報を取得
  const currentCategory = categories.find(
    (cat) => cat.slug === selectedCategory
  );

  // 宣言に default があるフィールドは初期値を入れておく。カテゴリを選び直すと
  // この画面はいったん閉じて (アンマウントされて) 開き直るので、初期化は 1 回でよい。
  // 戻る前に入力していた値があればそちらを優先する
  const [formData, setFormData] = useState<PostFormValues>(() => ({
    title: initialValues?.title ?? "",
    url: initialValues?.url ?? "",
    description: initialValues?.description ?? "",
    option: initialValues?.option ?? defaultOptionValues(currentCategory),
  }));

  const [slugCheckStatus, setSlugCheckStatus] =
    useState<SlugCheckStatus>("idle");

  const styles = postFormModalStyles();

  // 座標入力を出すかどうかはカテゴリの option 宣言から決まる
  const requiresPosition = hasPositionOption(currentCategory);

  // カテゴリが宣言した enum フィールド。選択肢は Select の collection に変換する
  const enumFields = useMemo(
    () => enumOptionFields(currentCategory),
    [currentCategory]
  );
  const enumCollections = useMemo(
    () =>
      new Map(
        enumFields.map(({ key, values }) => [
          key,
          createListCollection({
            // value が frontmatter に保存される id、label が表示名
            items: values.map((value) => ({
              label: value.display,
              value: value.id,
            })),
          }),
        ])
      ),
    [enumFields]
  );

  // Slugの重複チェック
  const checkSlugAvailability = useCallback(
    async (slug: string) => {
      if (!slug.trim()) {
        setSlugCheckStatus("idle");
        return;
      }

      console.log("チェック対象slug:", slug);
      console.log("既存slugs:", existingSlugs);

      setSlugCheckStatus("checking");

      // 少し遅延を入れてリアルタイム入力に対応
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 正規化して比較（大文字小文字を無視し、空白やスペシャル文字も考慮）
      const normalizedInputSlug = slug.toLowerCase().trim();
      const isDuplicate = existingSlugs.some((existingSlug) => {
        const normalizedExistingSlug = existingSlug.toLowerCase().trim();
        return normalizedExistingSlug === normalizedInputSlug;
      });

      console.log("重複チェック結果:", isDuplicate);
      console.log("正規化された入力slug:", normalizedInputSlug);

      if (isDuplicate) {
        setSlugCheckStatus("duplicate");
      } else {
        setSlugCheckStatus("available");
      }
    },
    [existingSlugs]
  );

  // URLが変更されたときにチェックを実行
  useEffect(() => {
    if (formData.url) {
      checkSlugAvailability(formData.url);
    }
  }, [formData.url, checkSlugAvailability]);

  const isFormValid =
    formData.title.trim() !== "" &&
    formData.url.trim() !== "" &&
    slugCheckStatus === "available" &&
    // 座標・enum など、カテゴリの宣言を満たしているか
    validateOptionValues(currentCategory, formData.option) === null;

  const handleInputChange = (
    field: keyof PostFormValues,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // option の 1 フィールド分を更新する。未入力・選択解除（ClearTrigger）では
  // キーごと落として、frontmatter にも書かれないようにする
  const handleOptionChange = (
    key: string,
    value: string | number | boolean | undefined
  ) => {
    setFormData((prev) => {
      const option = { ...prev.option };
      if (value === undefined || value === "") {
        delete option[key];
      } else {
        option[key] = value;
      }
      return { ...prev, option };
    });
  };

  const handleCoordinateChange = (key: PositionKey, value: string) => {
    const parsed = Number.parseInt(value, 10);
    handleOptionChange(key, Number.isNaN(parsed) ? undefined : parsed);
  };

  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit(formData);
    }
  };

  return (
    <ModalDialog.Container hasMainPadding>
      <ModalDialog.Title>
        <p className={styles.subtitle}>Wikiの新規作成 2/2</p>
        <h2 className={styles.heading}>必要な情報を教えてね</h2>
      </ModalDialog.Title>

      <ModalDialog.Content className={styles.main}>
        {/* Title Field */}
        <Field.Root required>
          <Field.Label>
            タイトル
            <Field.RequiredIndicator />
          </Field.Label>
          <Field.Input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="僕が考えた最強の建築物"
            maxLength={50}
          />
        </Field.Root>

        {/* URL Field */}
        {/* 既存の slug と重複したときだけ invalid にして、ErrorText と赤い枠線で知らせる */}
        <Field.Root
          required
          invalid={formData.url !== "" && slugCheckStatus === "duplicate"}
        >
          <Field.Label>
            URL
            <Field.RequiredIndicator />
          </Field.Label>
          <div className={styles.urlRow}>
            <span className={styles.urlPrefix}>wiki.morino.party/</span>
            <Field.Input
              type="text"
              value={formData.url}
              // 制御コンポーネントなので onChange で受け、使えない文字を落としてから state に入れる
              onChange={(e) => {
                const filteredValue = e.target.value
                  .replace(/[^a-zA-Z0-9\-]/g, "")
                  .toLowerCase()
                  .slice(0, 50);
                handleInputChange("url", filteredValue);
              }}
              pattern="[a-zA-Z0-9\-]*"
              placeholder="saikyo-architecture"
              minLength={5}
              maxLength={12}
              className={css({ flex: 1 })}
            />
          </div>
          {/* Slug availability status */}
          {formData.url && slugCheckStatus === "checking" && (
            <Field.HelperText>URLの確認中...</Field.HelperText>
          )}
          {formData.url && slugCheckStatus === "available" && (
            <Field.HelperText>✓ このURLは利用できます</Field.HelperText>
          )}
          {/* ErrorText は Field.Root が invalid のときだけ描画される */}
          <Field.ErrorText>✗ このURLは既に使用されています</Field.ErrorText>
        </Field.Root>

        {/* Description Field */}
        <Field.Root>
          <Field.Label>説明文</Field.Label>
          <Field.Input
            type="text"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="もりぱ一最強な建築物を紹介します。"
            maxLength={100}
          />
        </Field.Root>

        {/* Coordinate Fields - Only show if the category declares x / y */}
        {requiresPosition &&
          POSITION_KEYS.map((key) => (
            <Field.Root key={key} required>
              {/* ラベルとプレースホルダーはカテゴリの option 宣言に従う */}
              <Field.Label>
                {positionLabel(currentCategory, key)}
                <Field.RequiredIndicator />
              </Field.Label>
              <Field.Input
                type="number"
                value={
                  typeof formData.option?.[key] === "number"
                    ? formData.option[key]
                    : ""
                }
                onChange={(e) => {
                  handleCoordinateChange(key, e.target.value);
                }}
                placeholder={positionPlaceholder(currentCategory, key)}
              />
            </Field.Root>
          ))}

        {/* Enum Fields - カテゴリが option で宣言した選択式のフィールド */}
        {enumFields.map(({ key, field }) => {
          const collection = enumCollections.get(key);
          if (!collection) return null;
          // enum の値は選択肢の id（文字列）。それ以外が入っていたら未選択扱い
          const selected = formData.option?.[key];
          const value = typeof selected === "string" ? [selected] : [];
          return (
            // Select は外側の Field.Root から required やラベルの id を受け取るので、
            // RequiredIndicator と HelperText を他の入力欄と同じ形で使える
            <Field.Root key={key} required={field.required}>
              <Select.Root
                collection={collection}
                value={value}
                onValueChange={(details) =>
                  handleOptionChange(key, details.value[0])
                }
              >
                {/* ラベル・説明・プレースホルダーはカテゴリの宣言に従う */}
                {/* 行間は Field.Root の gap に任せるため、Select.Label 自身の下余白は消す */}
                <Select.Label className={css({ mb: "0" })}>
                  {field.label ?? key}
                  <Field.RequiredIndicator />
                </Select.Label>
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText
                      placeholder={field.placeholder ?? "選択してください"}
                    />
                    <Select.Indicator />
                  </Select.Trigger>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {collection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          <Select.ItemText>{item.label}</Select.ItemText>
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
              {field.description && (
                <Field.HelperText>{field.description}</Field.HelperText>
              )}
            </Field.Root>
          );
        })}
      </ModalDialog.Content>

      {/* Bottom navigation - 右寄せの並びは ModalDialog.Footer が持つ */}
      <ModalDialog.Footer>
        {/* 補助の操作なので plain にし、左端に寄せて主操作と離す */}
        <Button
          type="button"
          intent="plain"
          size="lg"
          className={css(buttonSize.raw({ size: "md" }), { mr: "auto" })}
          onClick={() => onBack(formData)}
        >
          <ChevronLeft aria-hidden />
          戻る
        </Button>
        <p className={styles.successMessage}>
          新しいページがついに生まれます！
        </p>
        {/* ダイアログの主操作なので primary の lg */}
        <Button
          type="button"
          intent="primary"
          size="lg"
          className={buttonSize({ size: "md" })}
          disabled={!isFormValid}
          onClick={handleSubmit}
        >
          ページを作る
        </Button>
      </ModalDialog.Footer>
    </ModalDialog.Container>
  );
};
