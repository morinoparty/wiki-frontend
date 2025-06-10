"use client";

import { Button, Editable, Spinner } from "@chakra-ui/react";
import { Tag, Image } from "lucide-react";
import { postHeaderStyles } from "./PostHeader";
import { css, cx } from "styled-system/css";
import { useRef, useState, useEffect } from "react";
import { uploadImage } from "@/actions/upload-image";
import { toaster } from "@/components/ui/toaster";

// 定数
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const TOAST_DURATION = {
  DEFAULT: 3000,
  ERROR: 5000,
};

interface PostHeaderEditProps {
  image?: string;
  category: string;
  title: string;
  description: string;
  onChange?: (fields: {
    title: string;
    description: string;
    category: string;
    image?: string;
  }) => void;
  disabled?: boolean;
  onSaveComplete?: boolean;
}

export function PostHeaderEdit({
  image,
  category,
  title,
  description,
  onChange,
  disabled,
  onSaveComplete,
}: PostHeaderEditProps) {
  const classes = postHeaderStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 画像プレビュー用のローカルステート
  const [previewImage, setPreviewImage] = useState<string | undefined>(image);
  // アップロード直後のbase64キャッシュ
  const [base64Cache, setBase64Cache] = useState<string | null>(null);

  // Chakra Editable v2: onValueChange/Commit receives { value: string }
  // const handleCategoryChange = (details: { value: string }) => {
  //   onChange?.({ title, description, category: details.value });
  // };
  const handleTitleChange = (details: { value: string }) => {
    onChange?.({
      title: details.value,
      description,
      category,
      image: previewImage,
    });
  };
  const handleDescriptionChange = (details: { value: string }) => {
    onChange?.({
      title,
      description: details.value,
      category,
      image: previewImage,
    });
  };

  // 画像アップロードボタンのクリック
  const handleImageIconClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const [isUploading, setIsUploading] = useState(false);

  // 保存完了時にbase64キャッシュをクリア
  useEffect(() => {
    if (onSaveComplete) {
      setBase64Cache(null);
    }
  }, [onSaveComplete]);

  /**
   * ファイルのバリデーションを行う
   * @param file 検証するファイル
   * @returns 検証結果（trueなら問題なし）
   */
  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toaster.error({
        title: "エラー",
        description: "ファイルサイズは5MB以下にしてください",
        duration: TOAST_DURATION.ERROR,
        meta: { closable: true },
      });
      return false;
    }
    return true;
  };

  /**
   * ファイルをbase64に変換する関数
   */
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * 画像ファイル選択時のハンドラー
   */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルのバリデーション
    if (!validateFile(file)) return;
    setIsUploading(true);

    try {
      // アップロード前にbase64でプレビュー表示
      const base64 = await convertToBase64(file);
      setBase64Cache(base64);

      const uploadPromise = uploadImage(file);

      toaster.promise(uploadPromise, {
        loading: {
          title: "アップロード中",
          description: "画像をアップロードしています...",
        },
        success: {
          title: "成功",
          description: "画像が正常にアップロードされました",
        },
        error: {
          title: "エラー",
          description: "アップロードに失敗しました",
        },
      });

      const result = await uploadPromise;

      if (!result.success || !result.data) {
        throw new Error(result.error || "アップロードに失敗しました");
      }

      // アップロード成功時の処理 - プレビュー画像更新と親への通知のみ
      setPreviewImage(result.data.url);
      onChange?.({
        title,
        description,
        category,
        image: result.data.url,
      });
    } catch (error) {
      console.error("画像アップロード中にエラーが発生しました:", error);
      setBase64Cache(null); // エラー時もキャッシュをクリア
    } finally {
      finishUpload();
    }
  };

  /**
   * アップロード終了時の共通処理
   */
  const finishUpload = (): void => {
    setIsUploading(false);

    // 入力フィールドをリセットして再アップロードできるようにする
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * カバー画像セクションのレンダリング
   */
  const renderCoverImage = () => {
    // base64キャッシュがある場合は優先的に表示（保存するまで）
    if (base64Cache) {
      return (
        <div
          className={classes.image}
          style={{
            backgroundImage: `url(${base64Cache})`,
            position: "relative",
          }}
        />
      );
    }

    // 通常のプレビュー画像表示
    return previewImage ? (
      <div
        className={classes.image}
        style={{
          backgroundImage: `url(${"https://wiki-contentdev.yahiro.workers.dev/" + previewImage})`,
          position: "relative",
        }}
      />
    ) : null;
  };

  /**
   * カテゴリとアップロードボタンセクションのレンダリング
   */
  const renderCategoryButtons = () => {
    return (
      <div
        className={cx(
          classes.category,
          css({ mb: "24px !important", gap: "0px !important", ml: "-14px" })
        )}
      >
        <Button size="sm" variant="ghost" opacity={0.5}>
          <Tag size={16} />
          カテゴリ
        </Button>
        <Button
          size="sm"
          variant="ghost"
          opacity={0.5}
          onClick={handleImageIconClick}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <Spinner size="sm" />
          ) : (
            <Image size={16} aria-label="カバー画像アイコン" />
          )}
          {isUploading
            ? "アップロード中..."
            : previewImage || base64Cache
              ? "カバー画像を変更"
              : "カバー画像を追加"}
        </Button>
      </div>
    );
  };

  /**
   * タイトル編集フィールドのレンダリング
   */
  const renderTitleEdit = () => {
    return (
      <Editable.Root
        value={title}
        onValueChange={handleTitleChange}
        disabled={disabled}
        selectOnFocus
        placeholder="タイトル"
        size="lg"
      >
        <Editable.Preview
          className={cx(classes.title, css({ px: "0", py: "0", margin: "0" }))}
        />
        <Editable.Textarea
          className={cx(
            classes.title,
            css({ px: "0", py: "0", margin: "0", fieldSizing: "content" })
          )}
        />
      </Editable.Root>
    );
  };

  /**
   * 説明編集フィールドのレンダリング
   */
  const renderDescriptionEdit = () => {
    return (
      <Editable.Root
        value={description}
        onValueChange={handleDescriptionChange}
        disabled={disabled}
        selectOnFocus
        placeholder="説明"
        size="md"
        autoResize={false}
      >
        <Editable.Preview
          className={cx(
            classes.description,
            css({ px: "0", py: "0", margin: "0" })
          )}
        />
        <Editable.Input
          className={cx(
            classes.description,
            css({ px: "0", py: "0", margin: "0", fieldSizing: "content" })
          )}
        />
      </Editable.Root>
    );
  };

  return (
    <header
      className={cx(
        classes.container,
        css({
          bg: "white",
          borderBottom: "0px solid",
          pt: "53px",
        })
      )}
    >
      {/* 非表示のファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageChange}
        disabled={disabled}
      />

      {/* カバー画像表示 */}
      {renderCoverImage()}

      {/* コンテンツセクション */}
      <div
        className={cx(classes.info, css({ pt: "96px", pb: "16px" }))}
        style={{
          paddingTop: previewImage || base64Cache ? "72px" : "96px",
        }}
      >
        {/* カテゴリとアップロードボタン */}
        {renderCategoryButtons()}

        {/* タイトル編集 */}
        {renderTitleEdit()}

        {/* 説明編集 */}
        {renderDescriptionEdit()}
      </div>
    </header>
  );
}
