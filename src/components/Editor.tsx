"use client";

import {
  MDXEditor,
  MDXEditorMethods,
  headingsPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  BlockTypeSelect,
  linkPlugin,
  markdownShortcutPlugin,
  imagePlugin,
  tablePlugin,
  listsPlugin,
  directivesPlugin,
  AdmonitionDirectiveDescriptor,
  quotePlugin,
  codeBlockPlugin,
  thematicBreakPlugin,
  usePublisher,
  insertMarkdown$,
  insertImage$,
} from "@mdxeditor/editor";
import type { FC } from "react";
import HighlightToggle from "./toolbar/HighlightToggle";
import { ImageUploadModal } from "./ImageUploadModal";

import { useState, useEffect } from "react";
import { Image } from "lucide-react";
import { uploadImage } from "@/actions/upload-image";
import { toaster } from "@/components/ui/toaster";

import "@mdxeditor/editor/style.css";
import "./mdx-editor-custom.css";

// 定数
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const TOAST_DURATION = {
  DEFAULT: 3000,
  ERROR: 5000,
};

interface EditorProps {
  markdown: string;
  editorRef?: React.RefObject<MDXEditorMethods | null>;
  onChange: (markdown: string) => void;
}

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
 * ImageInsertComponent - MDXEditor内部で画像挿入機能を提供するコンポーネント
 */
const ImageInsertComponent = () => {
  // MDXEditorの信号システムを使用
  const insertMarkdown = usePublisher(insertMarkdown$);
  const insertImage = usePublisher(insertImage$);

  // グローバルに画像挿入と編集機能を提供
  useEffect(() => {
    // window オブジェクトに画像挿入関数を登録
    const windowWithMethods = window as unknown as {
      mdxEditorInsertImage?: (url: string, alt?: string) => void;
      mdxEditorOpenImageModal?: () => void;
    };

    // 画像挿入関数
    windowWithMethods.mdxEditorInsertImage = (
      imageUrl: string,
      altText?: string
    ) => {
      console.log("=== Window経由での画像挿入 ===");
      console.log("imageUrl:", imageUrl);
      console.log("altText:", altText);

      try {
        // アプローチ1: insertImage$ を使用（推奨）
        console.log("insertImage$ を試行中...");
        insertImage({ src: imageUrl, altText: altText || "画像" });
        console.log("✅ insertImage$ 成功");
      } catch (error) {
        console.error("❌ insertImage$ エラー:", error);

        // アプローチ2: insertMarkdown$ でフォールバック
        try {
          console.log("insertMarkdown$ フォールバックを試行中...");
          const markdownImage = `![${altText || "画像"}](${imageUrl})`;
          insertMarkdown(markdownImage);
          console.log("✅ insertMarkdown$ フォールバック成功");
        } catch (fallbackError) {
          console.error(
            "❌ insertMarkdown$ フォールバックもエラー:",
            fallbackError
          );
        }
      }
    };

    // 画像モーダルを開く関数（外部から呼び出し可能）
    windowWithMethods.mdxEditorOpenImageModal = () => {
      console.log("=== Window経由でモーダルを開く ===");
      (
        window as unknown as { setIsImageModalOpen?: (open: boolean) => void }
      ).setIsImageModalOpen?.(true);
    };

    // クリーンアップ
    return () => {
      delete windowWithMethods.mdxEditorInsertImage;
      delete windowWithMethods.mdxEditorOpenImageModal;
    };
  }, [insertMarkdown, insertImage]);

  return null; // このコンポーネントはUIを持たない
};

/**
 * Extend this Component further with the necessary plugins or props you need.
 * proxying the ref is necessary. Next.js dynamically imported components don't support refs.
 */
const Editor: FC<EditorProps> = ({ markdown, editorRef, onChange }) => {
  console.log("=== Editor レンダリング ===");
  console.log("markdown:", markdown?.substring(0, 100) + "...");
  console.log("editorRef:", editorRef);
  console.log("onChange:", onChange);

  // 画像アップロードモーダルの状態
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  // 編集中の画像情報
  const [editingImage, setEditingImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  // windowオブジェクトにモーダル開閉機能を提供
  useEffect(() => {
    (
      window as unknown as { setIsImageModalOpen?: (open: boolean) => void }
    ).setIsImageModalOpen = setIsImageModalOpen;
    (
      window as unknown as {
        setEditingImage?: (image: { src: string; alt: string } | null) => void;
      }
    ).setEditingImage = setEditingImage;

    return () => {
      delete (
        window as unknown as { setIsImageModalOpen?: (open: boolean) => void }
      ).setIsImageModalOpen;
      delete (
        window as unknown as {
          setEditingImage?: (
            image: { src: string; alt: string } | null
          ) => void;
        }
      ).setEditingImage;
    };
  }, []);

  /**
   * モーダルから画像を挿入する処理
   * windowオブジェクト経由でMDXEditor内部の機能を呼び出す
   */
  const handleImageInsert = (imageUrl: string, altText?: string) => {
    console.log("=== 外部画像挿入処理開始 ===");
    console.log("imageUrl:", imageUrl);
    console.log("altText:", altText);

    // Window経由でMDXEditor内部の機能を呼び出し
    const windowWithInsert = window as unknown as {
      mdxEditorInsertImage?: (url: string, alt?: string) => void;
    };
    if (windowWithInsert.mdxEditorInsertImage) {
      console.log("✅ Window経由で画像挿入を実行");
      windowWithInsert.mdxEditorInsertImage(imageUrl, altText);
    } else {
      console.error("❌ MDXEditor画像挿入機能が利用できません");
      // 最終フォールバック: onChangeを直接使用
      const markdownImage = `![${altText || "画像"}](${imageUrl})`;
      const newMarkdown = markdown + "\n\n" + markdownImage + "\n";
      onChange(newMarkdown);
      console.log("⚠️ フォールバック: onChange経由で画像挿入完了");
    }

    console.log("=== 外部画像挿入処理終了 ===");
  };

  return (
    <>
      <MDXEditor
        onChange={(newMarkdown) => {
          console.log(
            "MDXEditor onChange called with:",
            newMarkdown?.substring(0, 100) + "..."
          );
          onChange(newMarkdown);
        }}
        ref={editorRef}
        markdown={markdown}
        onError={(e) => console.error("Editor error", e)}
        suppressHtmlProcessing={true}
        plugins={[
          headingsPlugin({
            allowedHeadingLevels: [1, 2, 3, 4],
          }),
          linkPlugin(),
          tablePlugin(),
          listsPlugin(),
          directivesPlugin({
            directiveDescriptors: [AdmonitionDirectiveDescriptor],
          }),
          codeBlockPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),

          imagePlugin({
            // アップロードハンドラー（MDXEditor内部でドラッグ&ドロップなどに使用）
            imageUploadHandler: async (file: File) => {
              console.log("=== MDXEditor内部imageUploadHandler 呼び出し ===");
              console.log("file:", file.name, file.size);

              if (!validateFile(file)) {
                throw new Error("ファイルバリデーションに失敗しました");
              }

              try {
                const result = await uploadImage(file);
                if (!result.success || !result.data) {
                  throw new Error(result.error || "アップロードに失敗しました");
                }

                console.log(
                  "✅ MDXEditor内部アップロード成功:",
                  result.data.url
                );
                return result.data.url;
              } catch (error) {
                console.error("❌ MDXEditor内部アップロードエラー:", error);
                throw error;
              }
            },

            // プレビューハンドラー（画像表示用）
            imagePreviewHandler: async (url: string) => {
              console.log("🖼️ imagePreviewHandler called with:", url);

              // base64の場合はそのまま返す（プレビュー用）
              if (url.startsWith("data:")) {
                console.log("✅ Returning base64 for preview");
                return url;
              }

              // 完全なURLの場合はそのまま返す
              if (url.startsWith("https://") || url.startsWith("http://")) {
                console.log("✅ Returning full URL:", url);
                return url;
              }

              // 相対パスの場合は完全なURLを構築
              const fullUrl = `https://wiki-contentdev.yahiro.workers.dev/${url}`;
              console.log("✅ Constructed full URL:", fullUrl);
              return fullUrl;
            },

            // デフォルトの画像設定ボタンを無効にして、カスタムツールバーを使用
            disableImageSettingsButton: true,

            // リサイズ無効化とオートコンプリート設定
            disableImageResize: true,
            imageAutocompleteSuggestions: [],
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                {/* ImageInsertComponent を追加 */}
                <ImageInsertComponent />

                <ul className="toolbar-section">
                  <li>
                    <BlockTypeSelect />
                  </li>
                  <li>
                    <BoldItalicUnderlineToggles />
                    <HighlightToggle />
                    <button
                      onClick={() => {
                        console.log("画像ボタンクリック - モーダルを開く");
                        setIsImageModalOpen(true);
                      }}
                      type="button"
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        transition: "all 0.4s",
                      }}
                    >
                      <Image size={16} aria-label="画像を挿入" />
                    </button>
                  </li>
                </ul>
                <ul className="toolbar-section">
                  <li>
                    <UndoRedo />
                  </li>
                </ul>
              </>
            ),
          }),
          markdownShortcutPlugin(),
        ]}
        className="mdx-editor"
        contentEditableClassName="prose"
      />

      {/* 画像アップロードモーダル */}
      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setEditingImage(null);
        }}
        onImageInsert={handleImageInsert}
        editingImage={editingImage}
      />
    </>
  );
};

export default Editor;
