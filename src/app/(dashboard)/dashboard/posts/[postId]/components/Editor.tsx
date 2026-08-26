"use client";

// hagaki/editor (→ Lexical → prismjs の言語ファイル) より先に評価されないと
// いけない。順序に意味があるので他の import の下に動かさないこと。
import "./prism-global";

import { HagakiEditor, type MDXEditorMethods } from "hagaki/editor";
import type { ImageComponentAttrs } from "hagaki/markdown";
import { getPending } from "hagaki/pending-images";
import { ImagePlus } from "lucide-react";
import type { MutableRefObject } from "react";
import { resolveCdnUrl } from "hagaki";
import { CONTENT_BASE_URL } from "@/lib/hagaki";
import { committedImageUrl, pendingImagePreviewUrl } from "./pending-images";

import "@mdxeditor/editor/style.css";
import "./mdx-editor-custom.css";

/**
 * 記事本文のエディタ。hagaki の `<HagakiEditor>` (MDXEditor ベース) に
 * このプロジェクトのツールバー構成とスタイルを載せたもの。
 *
 * 画像は `<Image imageId="…" />` として挿入され、バイト列は保存されるまで
 * R2 の一時置き場に置かれる (`./pending-images`)。エディタ自身はコミットを
 * 打たない — 記事の保存時に本文と同じコミットへまとめて載る。
 */
export interface EditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  editorRef?: MutableRefObject<MDXEditorMethods | null>;
  /** 編集中の記事の uuid。画像の一時置き場のキーと表示 URL に使う。 */
  articleId: string;
  /** ファイルを受け取って `<Image />` の属性を返す (analyze + pending 開始)。 */
  onInsertImage: (file: File) => Promise<ImageComponentAttrs>;
  /** 既にコミット済みの画像 id。これ以外は一時置き場から表示する。 */
  committedImageIds: ReadonlySet<string>;
}

export default function Editor({
  markdown,
  onChange,
  editorRef,
  articleId,
  onInsertImage,
  committedImageIds,
}: EditorProps) {
  return (
    <HagakiEditor
      markdown={markdown}
      onChange={onChange}
      editorRef={editorRef}
      onInsertImage={onInsertImage}
      imagePreviewUrlFor={(id) =>
        // アップロード中は descriptor が pending store を直接見る。ここは
        // アップロード完了後のプレビュー URL と、コミット済み画像の CDN URL
        // の解決を担う。
        //
        // store に無くてもコミット済みとは限らない: リロードすると store は
        // 空になるが、バイト列は R2 の一時置き場に残っている。コミット済みの
        // id だけ CDN を見て、それ以外は一時置き場から引く。
        getPending(id)?.previewUrl ??
        (committedImageIds.has(id)
          ? committedImageUrl(id, articleId)
          : pendingImagePreviewUrl(articleId, id))
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
