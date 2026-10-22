import {
  Button,
  ModalDialog,
  RadioGroup,
} from "@morinoparty/chlorophyll-react/components";
import { WikiCategory } from "@/types/wiki";
import { useState } from "react";
import { sva } from "styled-system/css";
import { DashboardPostFormModal } from "./DashboardPostFormModal";
import type { PostFormValues } from "./DashboardPostFormModal";
import { buttonSize } from "@/components/buttonSize";

// grid 上の配置 (title / main / footer) とフッターの右寄せは ModalDialog の各パーツが持つので、
// ここでは見出しまわりとカテゴリ一覧の中身だけを持つ
const postAddModalStyles = sva({
  slots: [
    "heading",
    "subtitle",
    "main",
    "radioGroup",
    "categoryItem",
    "categoryContent",
    "categoryTitle",
    "categoryDescription",
  ],
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
    // ModalDialog.Content に当てる。カテゴリが多いときはこの中だけをスクロールさせ、上下を区切り線で挟む
    main: {
      maxHeight: "440px",
      overflowY: "auto",
      py: "32px",
      borderTop: "1px solid",
      borderBottom: "1px solid",
      borderColor: "border.subtle",
    },
    // RadioGroup.Root に当てる。縦積みはレシピが持つため、項目間の余白だけを指定する
    radioGroup: {
      gap: "32px",
    },
    // 丸・cursor・横並びは RadioGroup のレシピが持つため、ここでは項目間の余白と左右の内側余白だけを上書きする
    // (Content は端まで伸びるので、title / footer と同じ 38px をここで取る)
    categoryItem: {
      gap: "24px",
      borderRadius: "12px",
      px: "38px",
    },
    // Item は <label> なので、中身は span を block 化して縦に積む
    categoryContent: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      flex: 1,
    },
    // ItemText の文字色はレシピが持つため、見出しとしての大きさと太さだけを上書きする
    categoryTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      lineHeight: "1em",
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
    <ModalDialog.Container>
      <ModalDialog.Title>
        <p className={styles.subtitle}>Wikiの新規作成 1/2</p>
        <h2 className={styles.heading}>カテゴリを選びましょう</h2>
      </ModalDialog.Title>

      <ModalDialog.Content className={styles.main}>
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
              <RadioGroup.ItemControl />
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
