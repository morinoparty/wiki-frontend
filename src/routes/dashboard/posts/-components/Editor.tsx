// hagaki/editor (→ Lexical → prismjs の言語ファイル) より先に評価されないと
// いけない。順序に意味があるので他の import の下に動かさないこと。
import "./prism-global";

import {
  AdmonitionDirectiveDescriptor,
  type CodeBlockEditorDescriptor,
  CodeMirrorEditor,
  codeBlockPlugin,
  codeMirrorPlugin,
  directivesPlugin,
  headingsPlugin,
  imagePlugin,
  jsxPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  type RealmPlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import { HagakiEditor, type MDXEditorMethods } from "@morinoparty/hagaki/editor";
import type { ImageComponentAttrs } from "@morinoparty/hagaki/markdown";
import { getPending } from "@morinoparty/hagaki/pending-images";
import { ImagePlus } from "lucide-react";
import { type MutableRefObject, useMemo } from "react";
import { css } from "styled-system/css";
import { resolveCdnUrl } from "@morinoparty/hagaki";
import { CONTENT_BASE_URL } from "@/lib/content";
import { createDeletableImageDescriptor } from "./image-descriptor";
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

  // MDXEditor はマウント時にしか plugins を読まないが、毎レンダーで
  // 新しい配列を渡さないよう記事 (uuid / 下書きか) ごとに固定する
  const plugins = useMemo(
    () => buildEditorPlugins({ articleId, draft }),
    [articleId, draft],
  );

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
        // ツールバーの画像挿入ボタン (ImageComponentContext 経由) が使う
        onInsertImage={onInsertImage}
        // `plugins` を渡すと hagaki は children (Toolbar / Content スロット) を
        // 無視するので、本文のクラスはここで直接渡す
        plugins={plugins}
        contentEditableClassName="prose"
        className="mdx-editor"
        i18n={editorI18n}
      />
    </div>
  );
}

/**
 * コードブロックの言語の選択肢 (キー → 表示名)。
 *
 * 空文字キーは言語指定なし (` ``` ` だけのフェンス) を表す。同じ表示名の
 * キーは先頭のキーの別名として扱われる (`txt` / `text` は `""` と同じ)。
 */
const codeBlockLanguages: Record<string, string> = {
  "": "テキスト",
  txt: "テキスト",
  text: "テキスト",
  plaintext: "テキスト",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TypeScript (React)",
  js: "JavaScript",
  javascript: "JavaScript",
  jsx: "JavaScript (React)",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  bash: "Bash",
  sh: "Bash",
  shell: "Bash",
  css: "CSS",
  html: "HTML",
  xml: "XML",
  md: "Markdown",
  markdown: "Markdown",
  java: "Java",
  kotlin: "Kotlin",
  kt: "Kotlin",
  python: "Python",
  py: "Python",
  sql: "SQL",
  diff: "Diff",
};

/**
 * どの descriptor にも一致しないコードブロック用の受け皿。
 *
 * codeMirrorPlugin の descriptor は「meta が無い」か「言語が選択肢にある」
 * ときしか一致しないので、既存記事にある ` ```foo title="x" ` のような
 * ブロックは何にも一致せず、MDXEditor が例外を投げてエディタごと落ちる。
 * 優先度を最低にした catch-all で、どんなブロックも CodeMirror で開けるようにする。
 */
const fallbackCodeBlockDescriptor: CodeBlockEditorDescriptor = {
  priority: -10,
  match: () => true,
  Editor: CodeMirrorEditor,
};

/** エディタのツールバー。`toolbarPlugin` の中で描画される。 */
function EditorToolbar() {
  return (
    <>
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
    </>
  );
}

/**
 * MDXEditor のプラグイン一式を組み立てる。
 *
 * hagaki の `<HagakiEditor>` が内部で組む構成 (`buildPlugins`) と同じだが、
 * 次の 2 点を差し替えている。
 *
 * - コードブロック: hagaki は素の `codeBlockPlugin()` だけでコードブロック
 *   エディタを登録しないため、挿入すると
 *   "No CodeBlockEditor registered for language= meta=" で落ちる。
 *   `codeMirrorPlugin` と catch-all の descriptor を足す
 * - `<Image />`: ホバーで削除ボタンを出す descriptor に差し替える
 */
function buildEditorPlugins({
  articleId,
  draft,
}: {
  articleId: string;
  draft?: boolean;
}): RealmPlugin[] {
  // エンコード中は descriptor が pending store を直接見て blurhash を出す。
  // ここはエンコード後の object URL と、コミット済み画像の URL の解決を担う。
  // store に無い id はコミット済みとして扱う。
  const previewUrlFor = (id: string) =>
    getPending(id)?.previewUrl ?? committedImageUrl(id, articleId, draft);

  return [
    headingsPlugin(),
    linkPlugin(),
    tablePlugin(),
    listsPlugin(),
    directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
    jsxPlugin({
      jsxComponentDescriptors: [createDeletableImageDescriptor({ previewUrlFor })],
    }),
    codeBlockPlugin({
      defaultCodeBlockLanguage: "",
      codeBlockEditorDescriptors: [fallbackCodeBlockDescriptor],
    }),
    codeMirrorPlugin({ codeBlockLanguages }),
    quotePlugin(),
    thematicBreakPlugin(),
    markdownShortcutPlugin(),
    // 旧形式 `![alt](/article/...)` の画像は CDN URL に解決する
    imagePlugin({
      imagePreviewHandler: async (src) => resolveCdnUrl(src, CONTENT_BASE_URL),
    }),
    toolbarPlugin({
      toolbarClassName: "toolbar-section",
      toolbarContents: () => <EditorToolbar />,
    }),
  ];
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
