import { Editable } from "@ark-ui/react/editable";
import { Switch } from "@ark-ui/react/switch";
import { Spinner } from "@morinoparty/chlorophyll-react/components";
import { Tag, Image, EyeOff } from "lucide-react";
import { Button } from "@/components/Button";
import { postHeaderStyles } from "@/components/PostHeader";
import { css, cx, sva } from "styled-system/css";

// Chakra の Editable が持っていた最低限の見た目(枠線なし・背景透過・折返し)を
// Ark の素の Editable に与える。フォントまわりは呼び出し側の
// postHeaderStyles(title / description)がそのまま担当する。
const editableStyles = sva({
  slots: ["area", "preview", "input"],
  base: {
    area: {
      display: "block",
      width: "100%",
    },
    preview: {
      display: "block",
      width: "100%",
      cursor: "text",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    input: {
      display: "block",
      width: "100%",
      bg: "transparent",
      border: "none",
      outline: "none",
      resize: "none",
      font: "inherit",
      color: "inherit",
      _focusVisible: {
        outline: "none",
      },
    },
  },
});
import { useRef, useState, useEffect } from "react";
import { blurhashToBase64 } from "@morinoparty/hagaki/markdown";
import type { WikiThumbnail } from "@/types/wiki";
import { handleInsertImage } from "./pending-images";
import { toaster } from "@/components/ui/toaster";

// 定数
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const TOAST_DURATION = {
  DEFAULT: 3000,
  ERROR: 5000,
};

interface PostHeaderEditProps {
  /** 編集中の記事の uuid。サムネイルは記事の assets 配下に保存される。 */
  articleId: string;
  /** 現在のサムネイル。未設定なら null。 */
  thumbnail?: WikiThumbnail | null;
  category: string;
  title: string;
  description: string;
  /** 下書きか。true の間は配信されない (frontmatter に永続化)。 */
  draft?: boolean;
  onChange?: (fields: {
    title?: string;
    description?: string;
    category?: string;
    thumbnail?: WikiThumbnail | null;
    draft?: boolean;
  }) => void;
  disabled?: boolean;
  onSaveComplete?: boolean;
}

export function PostHeaderEdit({
  articleId,
  thumbnail,
  category,
  title,
  description,
  draft,
  onChange,
  disabled,
  onSaveComplete,
}: PostHeaderEditProps) {
  const classes = postHeaderStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 画像プレビュー用のローカルステート
  const [thumb, setThumb] = useState<WikiThumbnail | null>(thumbnail ?? null);
  // 本文の画像と同じく article-assets ルート経由。配信済みなら CDN へ
  // リダイレクトされ、下書き中や保存直後はリポジトリの実体が返る。
  const previewImage = thumb
    ? `/api/article-assets/${articleId}/${thumb.imageId}${draft ? "?draft=1" : ""}`
    : undefined;
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
      thumbnail: thumb,
    });
  };
  const handleDescriptionChange = (details: { value: string }) => {
    onChange?.({
      title,
      description: details.value,
      category,
      thumbnail: thumb,
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

      // 本文の画像と同じ pending フロー。AVIF の Blob はブラウザに置かれ、
      // 記事の保存時に本文と同じコミットへ入る。
      const attrs = await handleInsertImage(file);
      const next: WikiThumbnail = {
        imageId: attrs.id,
        blurhash64: attrs.blurhash ? blurhashToBase64(attrs.blurhash) : "",
      };
      setThumb(next);
      onChange?.({ title, description, category, thumbnail: next });
      toaster.success({
        title: "成功",
        description: "画像を設定しました。記事を保存すると確定します",
        duration: TOAST_DURATION.DEFAULT,
        meta: { closable: true },
      });
    } catch (error) {
      console.error("画像の読み込み中にエラーが発生しました:", error);
      setBase64Cache(null); // エラー時もキャッシュをクリア
      toaster.error({
        title: "エラー",
        description:
          error instanceof Error ? error.message : "画像の設定に失敗しました",
        duration: TOAST_DURATION.ERROR,
        meta: { closable: true },
      });
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
          backgroundImage: `url(${previewImage})`,
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
        <Button
          size="sm"
          variant="ghost"
          className={css({ opacity: 0.5 })}
        >
          <Tag size={16} />
          カテゴリ
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={css({ opacity: 0.5 })}
          onClick={handleImageIconClick}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <Spinner size="sm" />
          ) : (
            <Image size={16} aria-label="カバー画像アイコン" />
          )}
          {isUploading
            ? "画像を準備中..."
            : previewImage || base64Cache
              ? "カバー画像を変更"
              : "カバー画像を追加"}
        </Button>
        <Switch.Root
          checked={draft === true}
          onCheckedChange={(details: { checked: boolean }) =>
            onChange?.({ draft: details.checked })
          }
          disabled={disabled}
          className={css({
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            ml: "8px",
            cursor: "pointer",
            opacity: 0.7,
          })}
        >
          <Switch.Control
            className={css({
              display: "inline-flex",
              alignItems: "center",
              width: "36px",
              height: "20px",
              p: "2px",
              borderRadius: "full",
              bg: "gray.300",
              transition: "background 0.15s",
              _checked: { bg: "colorPalette.default" },
            })}
          >
            <Switch.Thumb
              className={css({
                width: "16px",
                height: "16px",
                borderRadius: "full",
                bg: "white",
                transition: "transform 0.15s",
                _checked: { transform: "translateX(16px)" },
              })}
            />
          </Switch.Control>
          <Switch.Label
            className={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              textStyle: "body",
              fontSize: "sm",
              color: "colorPalette.fg",
            })}
          >
            <EyeOff size={14} aria-hidden />
            下書き（非公開）
          </Switch.Label>
          <Switch.HiddenInput />
        </Switch.Root>
      </div>
    );
  };

  /**
   * タイトル編集フィールドのレンダリング
   */
  const renderTitleEdit = () => {
    const editable = editableStyles();
    return (
      <Editable.Root
        value={title}
        onValueChange={handleTitleChange}
        disabled={disabled}
        selectOnFocus
        placeholder="タイトル"
        autoResize
      >
        <Editable.Area className={editable.area}>
          <Editable.Preview
            className={cx(
              editable.preview,
              classes.title,
              css({ px: "0", py: "0", margin: "0" })
            )}
          />
          {/* Ark には Chakra の Editable.Textarea 相当が無いため、
              タイトルの編集中は 1 行入力になる(表示は従来どおり折り返す) */}
          <Editable.Input
            className={cx(
              editable.input,
              classes.title,
              css({ px: "0", py: "0", margin: "0" })
            )}
          />
        </Editable.Area>
      </Editable.Root>
    );
  };

  /**
   * 説明編集フィールドのレンダリング
   */
  const renderDescriptionEdit = () => {
    const editable = editableStyles();
    return (
      <Editable.Root
        value={description}
        onValueChange={handleDescriptionChange}
        disabled={disabled}
        selectOnFocus
        placeholder="説明"
        autoResize={false}
      >
        <Editable.Area className={editable.area}>
          <Editable.Preview
            className={cx(
              editable.preview,
              classes.description,
              css({ px: "0", py: "0", margin: "0" })
            )}
          />
          <Editable.Input
            className={cx(
              editable.input,
              classes.description,
              css({ px: "0", py: "0", margin: "0" })
            )}
          />
        </Editable.Area>
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
