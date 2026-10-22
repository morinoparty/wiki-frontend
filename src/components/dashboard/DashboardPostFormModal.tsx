import { Button } from "@/components/Button";
import {
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
import { sva } from "styled-system/css";

const postFormModalStyles = sva({
  slots: [
    "container",
    "title",
    "heading",
    "subtitle",
    "main",
    "formGroup",
    "labelRow",
    "label",
    "required",
    "description",
    "inputGroup",
    "input",
    "urlPrefix",
    "textarea",
    "footer",
    "navigationArea",
    "successMessage",
    "slugStatus",
    "slugError",
    "slugSuccess",
  ],
  base: {
    container: {
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      bgColor: "colorPalette.surface",
    },
    title: {
      gridArea: "title",
    },
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
      gridArea: "main",
      display: "flex",
      flexDirection: "column",
      gap: "40px",
      py: "32px",
      borderTop: "1px solid",
      borderBottom: "1px solid",
      borderColor: "border.subtle",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    labelRow: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    label: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "colorPalette.fg",
      lineHeight: "1.7",
    },
    required: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "colorPalette.fg",
      lineHeight: "1.7",
    },
    description: {
      fontSize: "14px",
      fontWeight: "500",
      color: "colorPalette.fg.subtle",
      lineHeight: "1.5",
    },
    inputGroup: {
      display: "flex",
      alignItems: "center",
      bgColor: "white",
      border: "0px 0px 2px solid",
      borderColor: "border.muted",
      borderRadius: "0px",
      overflow: "hidden",
    },
    input: {
      flex: 1,
      padding: "15px 18px 15px 0px",
      border: "none",
      outline: "none",
      fontSize: "18px",
      fontWeight: "500",
      color: "colorPalette.fg",
      backgroundColor: "transparent",
      lineHeight: "1.7",
      borderBottom: "2px solid",
      borderColor: "border.subtle",
      "&::placeholder": {
        color: "colorPalette.fg.subtle",
        opacity: 1,
      },
      "&:focus": {
        outline: "none",
        "& + .border": {
          borderColor: "colorPalette.border",
        },
      },
    },
    urlPrefix: {
      fontSize: "16px",
      fontWeight: "500",
      color: "fg.subtle",
      lineHeight: "1.7",
      padding: "15px 8px 15px 0px",
      flexShrink: 0,
    },
    textarea: {
      padding: "15px 18px 15px 0px",
      border: "0px 0px 2px solid",
      borderColor: "border.muted",
      borderRadius: "0px",
      outline: "none",
      fontSize: "16px",
      fontWeight: "500",
      color: "colorPalette.fg.subtle",
      backgroundColor: "white",
      lineHeight: "1.7",
      resize: "none",
      minHeight: "50px",
      "&::placeholder": {
        color: "colorPalette.fg.subtle",
        opacity: 1,
      },
      "&:focus": {
        outline: "none",
      },
    },
    footer: {
      gridArea: "footer",
      position: "relative",
    },
    navigationArea: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "20px",
    },
    successMessage: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "colorPalette.fg.subtle",
      lineHeight: "1.7",
      textAlign: "right",
      flex: 1,
    },
    slugStatus: {
      fontSize: "14px",
      fontWeight: "500",
      lineHeight: "1.5",
      mt: "4px",
    },
    slugError: {
      color: "red.11",
    },
    slugSuccess: {
      color: "colorPalette.fg",
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
  onBack: () => void;
  onSubmit: (data: PostFormValues) => void;
}> = ({ selectedCategory, categories, existingSlugs, onSubmit }) => {
  // 選択されたカテゴリの情報を取得
  const currentCategory = categories.find(
    (cat) => cat.slug === selectedCategory
  );

  // 宣言に default があるフィールドは初期値を入れておく。カテゴリを選び直すと
  // この画面はいったん閉じて (アンマウントされて) 開き直るので、初期化は 1 回でよい
  const [formData, setFormData] = useState<PostFormValues>(() => ({
    title: "",
    url: "",
    description: "",
    option: defaultOptionValues(currentCategory),
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
      <div className={styles.title}>
        <p className={styles.subtitle}>Wikiの新規作成 2/2</p>
        <h2 className={styles.heading}>必要な情報を教えてね</h2>
      </div>

      <div className={styles.main}>
        {/* Title Field */}
        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <label className={styles.label}>タイトル</label>
            <span className={styles.required}>*</span>
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="僕が考えた最強の建築物"
              className={styles.input}
              maxLength={50}
            />
          </div>
        </div>

        {/* URL Field */}
        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <label className={styles.label}>URL</label>
            <span className={styles.required}>*</span>
          </div>
          <div className={styles.inputGroup}>
            <span className={styles.urlPrefix}>wiki.morino.party/</span>
            <input
              type="text"
              value={formData.url}
              onInput={(e) => {
                const input = e.target as HTMLInputElement;
                const filteredValue = input.value
                  .replace(/[^a-zA-Z0-9\-]/g, "")
                  .toLowerCase()
                  .slice(0, 50);
                handleInputChange("url", filteredValue);
              }}
              pattern="[a-zA-Z0-9\-]*"
              placeholder="saikyo-architecture"
              className={styles.input}
              minLength={5}
              maxLength={12}
            />
          </div>
          {/* Slug availability status */}
          {formData.url && (
            <div
              className={`${styles.slugStatus} ${
                slugCheckStatus === "checking"
                  ? ""
                  : slugCheckStatus === "available"
                    ? styles.slugSuccess
                    : slugCheckStatus === "duplicate"
                      ? styles.slugError
                      : ""
              }`}
            >
              {slugCheckStatus === "checking" && "URLの確認中..."}
              {slugCheckStatus === "available" && "✓ このURLは利用できます"}
              {slugCheckStatus === "duplicate" &&
                "✗ このURLは既に使用されています"}
            </div>
          )}
        </div>

        {/* Description Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>説明文</label>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="もりぱ一最強な建築物を紹介します。"
              className={styles.input}
              maxLength={100}
            />
          </div>
        </div>

        {/* Coordinate Fields - Only show if the category declares x / y */}
        {requiresPosition &&
          POSITION_KEYS.map((key) => (
            <div key={key} className={styles.formGroup}>
              <div className={styles.labelRow}>
                {/* ラベルとプレースホルダーはカテゴリの option 宣言に従う */}
                <label className={styles.label}>
                  {positionLabel(currentCategory, key)}
                </label>
                <span className={styles.required}>*</span>
              </div>
              <div className={styles.inputGroup}>
                <input
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
                  className={styles.input}
                />
              </div>
            </div>
          ))}

        {/* Enum Fields - カテゴリが option で宣言した選択式のフィールド */}
        {enumFields.map(({ key, field }) => {
          const collection = enumCollections.get(key);
          if (!collection) return null;
          // enum の値は選択肢の id（文字列）。それ以外が入っていたら未選択扱い
          const selected = formData.option?.[key];
          const value = typeof selected === "string" ? [selected] : [];
          return (
            <div key={key} className={styles.formGroup}>
              <Select.Root
                collection={collection}
                value={value}
                onValueChange={(details) =>
                  handleOptionChange(key, details.value[0])
                }
              >
                <div className={styles.labelRow}>
                  {/* ラベル・説明・プレースホルダーはカテゴリの宣言に従う */}
                  <Select.Label className={styles.label}>
                    {field.label ?? key}
                  </Select.Label>
                  {field.required && <span className={styles.required}>*</span>}
                </div>
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
                <p className={styles.description}>{field.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom navigation */}
      <div className={styles.footer}>
        <div className={styles.navigationArea}>
          <p className={styles.successMessage}>
            新しいページがついに生まれます！
          </p>
          <Button size={"md"} disabled={!isFormValid} onClick={handleSubmit}>
            ページを作る
          </Button>
        </div>
      </div>
    </ModalDialog.Container>
  );
};
