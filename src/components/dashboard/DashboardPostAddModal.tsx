import {
  Button,
  ModalDialog,
  RadioGroup,
} from "@morinoparty/chlorophyll-react/components";
import { WikiCategory } from "@/types/wiki";
import { useState } from "react";
import { css, cx, sva } from "styled-system/css";
import { DashboardPostFormModal } from "./DashboardPostFormModal";
import { postDialogStyles } from "./postDialogStyles";
import type { PostFormValues } from "./DashboardPostFormModal";
import { buttonSize } from "@/components/buttonSize";

// 枠・見出し・区切り線は postDialogStyles で 2/2 と共通にし、ここではカテゴリ一覧の中身だけを持つ
const postAddModalStyles = sva({
  slots: [
    "main",
    "radioGroup",
    "categoryItem",
    "categoryContent",
    "categoryTitle",
    "categoryDescription",
  ],
  base: {
    // カテゴリが多いときは一覧の中だけをスクロールさせる
    main: {
      maxHeight: "440px",
      overflowY: "auto",
    },
    // 行そのものに面を持たせるので、行と行の間はわずかに空けるだけにする
    radioGroup: {
      gap: "4px",
    },
    // 1 行を押しやすい面にする。hover と選択中で地色を付け、
    // 左右に 16px はみ出させて丸の位置を見出しの左端に揃える
    categoryItem: {
      gap: "16px",
      alignItems: "flex-start",
      px: "16px",
      py: "12px",
      mx: "-16px",
      borderRadius: "12px",
      transition: "background-color 0.15s ease",
      _hover: {
        bg: "colorPalette.surface.subtle",
      },
      _checked: {
        bg: "colorPalette.surface",
      },
    },
    // Item は <label> なので、中身は span を block 化して縦に積む
    categoryContent: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      flex: 1,
    },
    // ItemText の文字色はレシピが持つため、見出しとしての大きさと太さだけを上書きする
    categoryTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      lineHeight: "1.5",
    },
    categoryDescription: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "colorPalette.fg.subtle",
      lineHeight: "1.5",
    },
  },
});

export const DashboardPostAddModal: React.FC<{
  categories: WikiCategory[];
  existingSlugs: string[];
  onCreatePost?: (data: PostFormValues & { category: string }) => void;
}> = ({ categories, existingSlugs, onCreatePost }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"category" | "form">(
    "category"
  );

  const styles = postAddModalStyles();
  const dialog = postDialogStyles();

  const handleNext = () => {
    if (selectedCategory) {
      setCurrentStep("form");
    }
  };

  // 戻ったときに、フォームに入力していた値を保持しておく
  const [draftValues, setDraftValues] = useState<{
    category: string;
    values: PostFormValues;
  } | null>(null);

  const handleBack = (values: PostFormValues) => {
    if (selectedCategory) setDraftValues({ category: selectedCategory, values });
    setCurrentStep("category");
  };

  // タイトル・URL・説明はカテゴリに関係なく引き継ぐ。
  // option (enum など) はカテゴリごとに中身が違うので、同じカテゴリに戻ったときだけ引き継ぐ
  const initialValues: Partial<PostFormValues> | undefined = draftValues
    ? draftValues.category === selectedCategory
      ? draftValues.values
      : {
          title: draftValues.values.title,
          url: draftValues.values.url,
          description: draftValues.values.description,
        }
    : undefined;

  const handleSubmit = (formData: PostFormValues) => {
    if (selectedCategory && onCreatePost) {
      onCreatePost({
        ...formData,
        category: selectedCategory,
      });
    }
  };

  if (currentStep === "form" && selectedCategory) {
    return (
      <DashboardPostFormModal
        selectedCategory={selectedCategory}
        categories={categories}
        existingSlugs={existingSlugs}
        onBack={handleBack}
        onSubmit={handleSubmit}
        initialValues={initialValues}
      />
    );
  }

  return (
    <ModalDialog.Container className={dialog.container}>
      <ModalDialog.Title>
        <p className={dialog.subtitle}>Wikiの新規作成 1/2</p>
        <h2 className={dialog.heading}>カテゴリを選びましょう</h2>
      </ModalDialog.Title>

      <ModalDialog.Content className={cx(dialog.main, styles.main)}>
        {/* カテゴリの選択。RadioGroup にすることで矢印キーでの移動や role="radio" による読み上げに対応する */}
        <RadioGroup.Root
          className={styles.radioGroup}
          aria-label="カテゴリ"
          value={selectedCategory}
          onValueChange={(details) => setSelectedCategory(details.value)}
        >
          {categories.map((category) => (
            <RadioGroup.Item
              key={category.slug}
              value={category.slug}
              className={styles.categoryItem}
            >
              {/* 1 行目 (カテゴリ名) の高さに丸を揃える */}
              <RadioGroup.ItemControl className={css({ mt: "2px" })} />
              {/* タイトルと説明を縦に並べる。説明は選択肢の名前 (ItemText) には含めない */}
              <span className={styles.categoryContent}>
                <RadioGroup.ItemText className={styles.categoryTitle}>
                  {category.title}
                </RadioGroup.ItemText>
                <span className={styles.categoryDescription}>
                  {category.body}
                </span>
              </span>
              {/* フォーカスとキーボード操作を担うネイティブの radio */}
              <RadioGroup.ItemHiddenInput />
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      </ModalDialog.Content>

      {/* 右寄せの並びは ModalDialog.Footer が持つ */}
      <ModalDialog.Footer>
        {/* ダイアログの主操作なので primary の lg */}
        <Button
          type="button"
          intent="primary"
          size="lg"
          className={buttonSize({ size: "md" })}
          disabled={!selectedCategory}
          onClick={handleNext}
        >
          次に進む
        </Button>
      </ModalDialog.Footer>
    </ModalDialog.Container>
  );
};
