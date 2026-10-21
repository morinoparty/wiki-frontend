"use client";

import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import type { MDXEditorMethods } from "@morinoparty/hagaki/editor";
import type { ImageComponentAttrs } from "@morinoparty/hagaki/markdown";
import { imageComponentMarkdown } from "@morinoparty/hagaki/markdown";
import { toaster } from "@/components/ui/toaster";

/**
 * エディタへの画像ドラッグ&ドロップ。
 *
 * ツールバーの挿入ボタンと同じ経路 (`onInsertImage` → pending フロー →
 * `<Image imageId="…" />`) に乗せる。MDXEditor 内蔵のファイルドロップは
 * `imageUploadHandler` を渡したときだけ動き、しかも旧形式の
 * `![alt](url)` を挿入するので使わない。
 *
 * 挿入位置は MDXEditor 内蔵のドロップと同じくドロップ地点ではなく
 * キャレット位置。あちらも `INSERT_IMAGE_COMMAND` を現在の選択に対して
 * 撃つだけなので、挙動を揃えている。
 */
interface UseImageDropOptions {
  editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
  onInsertImage: (file: File) => Promise<ImageComponentAttrs>;
}

/** OS からのファイルドロップだけを対象にする (エディタ内のノード移動や
 * テキスト選択のドラッグでも dragover は飛んでくる)。 */
function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

export function useImageDrop({ editorRef, onInsertImage }: UseImageDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  // dragenter / dragleave は子要素をまたぐたびに発火するので、深さを数えて
  // 本当に外へ出たときだけオーバーレイを消す。
  const depth = useRef(0);

  const reset = useCallback(() => {
    depth.current = 0;
    setIsDragOver(false);
  }, []);

  const insert = useCallback(
    (attrs: ImageComponentAttrs) => {
      const editor = editorRef?.current;
      if (!editor) return;
      // insertMarkdown は選択が無いと黙って何もしないので、focus の
      // コールバックで挿入する。既に選択があれば Lexical がそれを復元する。
      const md = imageComponentMarkdown(attrs);
      editor.focus(() => editor.insertMarkdown(md), {
        defaultSelection: "rootEnd",
      });
    },
    [editorRef]
  );

  const handleDragEnter = useCallback((event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    depth.current += 1;
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((event: DragEvent) => {
    if (!hasFiles(event)) return;
    // preventDefault しないとブラウザがファイルを開いてしまう。
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((event: DragEvent) => {
    if (!hasFiles(event)) return;
    depth.current -= 1;
    if (depth.current <= 0) reset();
  }, [reset]);

  const handleDrop = useCallback(
    async (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      reset();

      const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
        file.type.startsWith("image/")
      );
      if (files.length === 0) return;

      for (const file of files) {
        try {
          insert(await onInsertImage(file));
        } catch (error) {
          console.error("画像のドロップに失敗しました:", error);
          toaster.error({
            title: "エラー",
            description:
              error instanceof Error
                ? error.message
                : "画像を読み込めませんでした",
            duration: 5000,
            meta: { closable: true },
          });
        }
      }
    },
    [insert, onInsertImage, reset]
  );

  return {
    isDragOver,
    dropHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
