import {
  Button,
  Field,
  ModalDialog,
  Portal,
  Select,
  createListCollection,
} from "@morinoparty/chlorophyll-react/components";
import { PostOptionValues, WikiCategory } from "@/types/wiki";
import {
  defaultOptionValues,
  enumOptionFields,
  validateOptionValues,
} from "@/lib/categoryOptions";
import { useState, useEffect, useCallback, useMemo } from "react";
import { css, cx, sva } from "styled-system/css";
import { postDialogStyles } from "./postDialogStyles";
import { buttonSize } from "@/components/buttonSize";
import { ChevronLeft } from "lucide-react";

// フォームの部品 (ラベル・入力欄・必須の印・補足/エラー) は chlorophyll の Field に任せ、
// 枠・見出し・区切り線は postDialogStyles で 1/2 と共通にする。ここではフォームの並びだけを持つ
const postFormModalStyles = sva({
  slots: ["main", "urlRow", "urlPrefix"],
  base: {
    // 入力欄を縦に積む。ラベルと入力欄のまとまりが分かる程度に間を空ける
    main: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
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
  },
});

/** このダイアログが集める記事の入力値。option の中身はカテゴリの宣言次第。 */
export interface PostFormValues {
  title: string;
  url: string;
  description: string;
  /**
   * カテゴリが option で宣言したフィールドの値。enum は
   * 選択肢の id を入れる（記事の frontmatter `option.<key>` に保存される）。
   */
  option?: PostOptionValues;
}

/**
 * 入力欄の slug を、サーバーが返す使用中の slug (hagaki の `toUrlSlug` 済み) と
 * 比較できる形にそろえる。
 *
 * 入力欄は英数字とハイフンしか受け付けないので、その範囲で `toUrlSlug` と同じ
 * 変換 (小文字化・連続ハイフンの圧縮・前後のハイフン除去) だけを行う。
 * hagaki の本体を import すると gray-matter などサーバー用の依存がこのページの
 * バンドルに入るため、ここでは使わない。最終的な重複チェックは createPost が行う。
 */
function toComparableSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  // 使用中の slug (toUrlSlug 済み) を引きやすい形にしておく
  const existingSlugSet = useMemo(() => new Set(existingSlugs), [existingSlugs]);

  const [slugCheckStatus, setSlugCheckStatus] =
    useState<SlugCheckStatus>("idle");

  const styles = postFormModalStyles();
  const dialog = postDialogStyles();

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

      setSlugCheckStatus("checking");

      // 少し遅延を入れてリアルタイム入力に対応
      await new Promise((resolve) => setTimeout(resolve, 300));

      // existingSlugs はサーバー側で toUrlSlug 済み (公開記事と下書きの和集合)。
      // 入力も同じ形にそろえて比較する
      const isDuplicate = existingSlugSet.has(toComparableSlug(slug));

      if (isDuplicate) {
        setSlugCheckStatus("duplicate");
      } else {
        setSlugCheckStatus("available");
      }
    },
    [existingSlugSet]
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
    // enum など、カテゴリの option 宣言を満たしているか
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

  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit(formData);
    }
  };

  return (
    <ModalDialog.Container className={dialog.container}>
      <ModalDialog.Title>
        <p className={dialog.subtitle}>Wikiの新規作成 2/2</p>
        <h2 className={dialog.heading}>必要な情報を教えてね</h2>
      </ModalDialog.Title>

      <ModalDialog.Content className={cx(dialog.main, styles.main)}>
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

      {/* 戻るは左端、主操作は右端に置く */}
      <ModalDialog.Footer>
        {/* 補助の操作なので plain にし、左端に寄せて主操作と離す */}
        <Button
          type="button"
          intent="plain"
          size="lg"
          // 高さは他のボタンとそろえ、左右の余白だけ詰めて文字の左端を見出しに合わせる
          className={css(buttonSize.raw({ size: "md" }), {
            mr: "auto",
            ml: "-16px",
            px: "16px",
          })}
          onClick={() => onBack(formData)}
        >
          <ChevronLeft aria-hidden />
          戻る
        </Button>
        {/* 必要な情報がそろったときだけ、主操作の横に一言添える */}
        {isFormValid && (
          <p className={dialog.footerNote}>新しいページがついに生まれます！</p>
        )}
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
