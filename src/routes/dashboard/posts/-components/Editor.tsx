// hagaki/editor (→ Lexical → prismjs の言語ファイル) より先に評価されないと
// いけない。順序に意味があるので他の import の下に動かさないこと。
import "./prism-global";

import { HagakiEditor, type MDXEditorMethods } from "@morinoparty/hagaki/editor";
import type { ImageComponentAttrs } from "@morinoparty/hagaki/markdown";
import { getPending } from "@morinoparty/hagaki/pending-images";
import { ImagePlus } from "lucide-react";
import type { MutableRefObject } from "react";
import { css } from "styled-system/css";
import { resolveCdnUrl } from "@morinoparty/hagaki";
import { CONTENT_BASE_URL } from "@/lib/content";
import { committedImageUrl } from "./pending-images";
import { useImageDrop } from "./useImageDrop";

import "@mdxeditor/editor/style.css";
import "./mdx-editor-custom.css";

/**
 * 記事本文のエディタ。hagaki の `<HagakiEditor>` (MDXEditor ベース) に
 * このプロジェクトのツールバー構成とスタイルを載せたもの。
 *
 * 画像は `<Image imageId="…" />` として挿入され、AVIF の Blob は保存されるまで
 * ブラウザのメモリに置かれる (`./pending-images`)。エディタ自身はコミットを
 * 打たない — 記事の保存時に本文と同じコミットへまとめて載る。
 *
 * ツールバーの挿入ボタンとドラッグ&ドロップ (`useImageDrop`) はどちらも
 * 同じ `onInsertImage` を通る。
 */
export interface EditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  editorRef?: MutableRefObject<MDXEditorMethods | null>;
  /** 編集中の記事の uuid。コミット済み画像の表示 URL に使う。 */
  articleId: string;
  /** 下書き記事か。コミット済み画像を CDN でなくリポジトリ経由で表示する。 */
  draft?: boolean;
  /** ファイルを受け取って `<Image />` の属性を返す (analyze + pending 開始)。 */
  onInsertImage: (file: File) => Promise<ImageComponentAttrs>;
}

export default function Editor({
  markdown,
  onChange,
  editorRef,
  articleId,
  draft,
  onInsertImage,
}: EditorProps) {
  const { isDragOver, dropHandlers } = useImageDrop({
    editorRef,
    onInsertImage,
  });

  return (
    <div className={css({ position: "relative" })} {...dropHandlers}>
      {isDragOver ? (
        <div
          aria-hidden
          className={css({
            position: "absolute",
            inset: "8px",
            zIndex: 10,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            border: "2px dashed",
            borderColor: "colorPalette.9",
            bg: "colorPalette.2/80",
            color: "colorPalette.11",
            fontWeight: "medium",
          })}
        >
          ここに画像をドロップ
        </div>
      ) : null}
      <HagakiEditor
        markdown={markdown}
        onChange={onChange}
        editorRef={editorRef}
        onInsertImage={onInsertImage}
        imagePreviewUrlFor={(id) =>
          // エンコード中は descriptor が pending store を直接見て blurhash を
          // 出す。ここはエンコード後の object URL と、コミット済み画像の URL
          // の解決を担う。store に無い id はコミット済みとして扱う。
          getPending(id)?.previewUrl ?? committedImageUrl(id, articleId, draft)
        }
        // 旧形式 `![alt](/article/...)` の画像は CDN URL に解決する。
        onImagePreview={async (src) => resolveCdnUrl(src, CONTENT_BASE_URL)}
        className="mdx-editor"
        i18n={editorI18n}
      >
        <HagakiEditor.Toolbar className="toolbar-section">
          <HagakiEditor.UndoRedo />
          <HagakiEditor.Separator />
          <HagakiEditor.BlockTypeSelect />
          <HagakiEditor.BoldItalicUnderlineToggles />
          <HagakiEditor.ListsToggle />
          <HagakiEditor.Separator />
          <HagakiEditor.CreateLink />
          <HagakiEditor.InsertTable />
          <HagakiEditor.InsertImage.ComponentButton title="画像を挿入">
            <ImagePlus size={16} aria-label="画像を挿入" />
          </HagakiEditor.InsertImage.ComponentButton>
          <HagakiEditor.InsertThematicBreak />
          <HagakiEditor.InsertCodeBlock />
        </HagakiEditor.Toolbar>
        <HagakiEditor.Content className="prose" />
      </HagakiEditor>
    </div>
  );
}

const editorI18n: Record<string, string> = {
  "toolbar.undo": "元に戻す",
  "toolbar.redo": "やり直す",
  "toolbar.bold": "太字",
  "toolbar.italic": "斜体",
  "toolbar.underline": "下線",
  "toolbar.table": "表を挿入",
  "toolbar.link": "リンク",
  "toolbar.codeBlock": "コードブロック",
  "toolbar.thematicBreak": "区切り線",
};
