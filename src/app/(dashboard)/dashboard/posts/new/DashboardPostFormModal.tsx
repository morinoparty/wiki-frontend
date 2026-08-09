"use client";

import { Button } from "@/components/Button";
import { ModalDialog } from "@morinoparty/chlorophyll-react/components";
import { WikiCategory } from "@/types/wiki";
import { useState, useEffect, useCallback } from "react";
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

interface PostFormData {
  title: string;
  url: string;
  description: string;
  x?: number;
  y?: number;
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
  onSubmit: (data: PostFormData) => void;
}> = ({ selectedCategory, categories, existingSlugs, onSubmit }) => {
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    url: "",
    description: "",
  });

  const [slugCheckStatus, setSlugCheckStatus] =
    useState<SlugCheckStatus>("idle");

  const styles = postFormModalStyles();

  // 選択されたカテゴリの情報を取得
  const currentCategory = categories.find(
    (cat) => cat.slug === selectedCategory
  );
  const requiresPosition = currentCategory?.hasPosition ?? false;

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
    // 座標が必要な場合は座標も入力必須
    (!requiresPosition ||
      (formData.x !== undefined &&
        formData.y !== undefined &&
        Number.isInteger(formData.x) &&
        Number.isInteger(formData.y)));

  const handleInputChange = (
    field: keyof PostFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCoordinateChange = (field: "x" | "y", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === "" ? undefined : parseInt(value, 10),
    }));
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

        {/* Coordinate Fields - Only show if the category requires position */}
        {requiresPosition && (
          <>
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>X座標</label>
                <span className={styles.required}>*</span>
              </div>
              <div className={styles.inputGroup}>
                <input
                  type="number"
                  value={formData.x ?? ""}
                  onChange={(e) => {
                    handleCoordinateChange("x", e.target.value);
                  }}
                  placeholder="例: 1000"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Y座標</label>
                <span className={styles.required}>*</span>
              </div>
              <div className={styles.inputGroup}>
                <input
                  type="number"
                  value={formData.y ?? ""}
                  onChange={(e) => {
                    handleCoordinateChange("y", e.target.value);
                  }}
                  placeholder="例: 2000"
                  className={styles.input}
                />
              </div>
            </div>
          </>
        )}
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
