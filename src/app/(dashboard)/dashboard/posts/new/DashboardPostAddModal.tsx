"use client";

import { Button } from "@/components/Button";
import { ModalDialog } from "@morinoparty/chlorophyll-react/components";
import { WikiCategory } from "@/types/wiki";
import { useState } from "react";
import { sva } from "styled-system/css";
import { DashboardPostFormModal } from "./DashboardPostFormModal";

const postAddModalStyles = sva({
  slots: [
    "container",
    "title",
    "heading",
    "subtitle",
    "main",
    "categoryItem",
    "radioButton",
    "radioChecked",
    "categoryContent",
    "categoryTitle",
    "categoryDescription",
    "footer",
    "navigationArea",
  ],
  base: {
    container: {
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      bgColor: "leaf.100",
    },
    title: {
      gridArea: "title",
    },
    subtitle: {
      textStyle: "body",
      fontWeight: "bold",
      color: "leaf.600/50",
      mb: "8px",
    },
    heading: {
      textStyle: "heading2",
      color: "leaf.600",
      fontSize: "26px",
    },
    main: {
      gridArea: "main",
      display: "flex",
      flexDirection: "column",
      gap: "32px",
      maxHeight: "440px",
      overflowY: "auto",
      py: "32px",
      borderTop: "1px solid",
      borderBottom: "1px solid",
      borderColor: "leaf.50",
    },
    categoryItem: {
      display: "flex",
      alignItems: "center",
      gap: "24px",
      cursor: "pointer",
      borderRadius: "12px",
      px: "38px",
    },
    radioButton: {
      width: "24px",
      height: "24px",
      position: "relative",
      borderRadius: "12px",
      border: "2px solid",
      borderColor: "leaf.300",
      bgColor: "leaf.100",
      flexShrink: 0,
    },
    radioChecked: {
      position: "absolute",
      top: "3px",
      left: "3px",
      width: "14px",
      height: "14px",
      borderRadius: "7px",
      bgColor: "leaf.600",
    },
    categoryContent: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      flex: 1,
    },
    categoryTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "leaf.600",
      lineHeight: "1em",
    },
    categoryDescription: {
      fontSize: "14px",
      fontWeight: "500",
      color: "leaf.600/50",
      lineHeight: "1.5",
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
  },
});

export const DashboardPostAddModal: React.FC<{
  categories: WikiCategory[];
  existingSlugs: string[];
  onCreatePost?: (data: {
    title: string;
    url: string;
    description: string;
    category: string;
  }) => void;
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

  const handleBack = () => {
    setCurrentStep("category");
  };

  const handleSubmit = (formData: {
    title: string;
    url: string;
    description: string;
  }) => {
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
      />
    );
  }

  return (
    <ModalDialog.Container>
      <div className={styles.title}>
        <p className={styles.subtitle}>Wikiの新規作成 1/2</p>
        <h2 className={styles.heading}>カテゴリを選びましょう</h2>
      </div>

      <div className={styles.main}>
        {categories.map((category) => (
          <div
            key={category.slug}
            onClick={() => setSelectedCategory(category.slug)}
            className={styles.categoryItem}
          >
            {/* Radio button / Choice box */}
            <div className={styles.radioButton}>
              {selectedCategory === category.slug && (
                <div className={styles.radioChecked} />
              )}
            </div>

            {/* Category content */}
            <div className={styles.categoryContent}>
              <h3 className={styles.categoryTitle}>{category.title}</h3>
              <p className={styles.categoryDescription}>{category.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom navigation with separator lines */}
      <div className={styles.footer}>
        <div className={styles.navigationArea}>
          <Button size={"md"} disabled={!selectedCategory} onClick={handleNext}>
            次に進む
          </Button>
        </div>
      </div>
    </ModalDialog.Container>
  );
};
