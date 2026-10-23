import {
  type JsxComponentDescriptor,
  type JsxEditorProps,
  readOnly$,
  useLexicalNodeRemove,
} from "@mdxeditor/editor";
import { useCellValue } from "@mdxeditor/gurx";
import { createImageComponentDescriptor } from "@morinoparty/hagaki/editor";
import { getPending, removePending } from "@morinoparty/hagaki/pending-images";
import { Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { css } from "styled-system/css";

/** `<Image />` ノードの属性から imageId を取り出す。無ければ undefined。 */
function readImageId(props: JsxEditorProps): string | undefined {
  for (const attr of props.mdastNode.attributes) {
    if (
      attr.type === "mdxJsxAttribute" &&
      attr.name === "imageId" &&
      typeof attr.value === "string"
    ) {
      return attr.value;
    }
  }
  return undefined;
}

/**
 * hagaki の `<Image />` 用 descriptor に、ホバーで出る削除ボタンを足したもの。
 *
 * 表示 (blurhash・変換中表示・エラー表示) は hagaki の Editor をそのまま使い、
 * その外側を画像と同じ大きさの inline-block で包んで右上にボタンを重ねる。
 * 元の Editor は `props.descriptor.config` を読むので、descriptor は
 * スプレッドで `config` を引き継ぐ。
 */
export function createDeletableImageDescriptor(config: {
  previewUrlFor: (id: string) => string;
}): JsxComponentDescriptor {
  const base = createImageComponentDescriptor(config);
  const BaseEditor = base.Editor;

  function DeletableImageEditor(props: JsxEditorProps) {
    const removeNode = useLexicalNodeRemove();
    const readOnly = useCellValue(readOnly$);

    const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const id = readImageId(props);
      removeNode();
      // 変換に失敗した画像だけはメモリ上のエントリも捨てる (hagaki の
      // エラー表示の「削除」と同じ挙動)。変換中・変換済みのエントリは
      // Undo でノードが戻ったときに Blob が必要になるので残しておく。
      // 本文に無い id は保存時に集められないので、残っていても送られない。
      if (id && getPending(id)?.status === "error") {
        removePending(id);
      }
    };

    return (
      <span className={wrapperClass}>
        <BaseEditor {...props} />
        {readOnly ? null : (
          <button
            type="button"
            className={deleteButtonClass}
            aria-label="画像を削除"
            title="画像を削除"
            // mousedown でフォーカスが移ると Lexical の選択が動いてしまうので止める
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={handleDelete}
          >
            <Trash2 size={16} aria-hidden />
          </button>
        )}
      </span>
    );
  }

  return { ...base, Editor: DeletableImageEditor };
}

// 画像 (hagaki の inline-block の span) にぴったり沿わせ、ボタンを画像の右上に置く
const wrapperClass = css({
  position: "relative",
  display: "inline-block",
  maxWidth: "100%",
  lineHeight: 0,
  "& > button": {
    opacity: 0,
    pointerEvents: "none",
  },
  "&:hover > button, &:focus-within > button": {
    opacity: 1,
    pointerEvents: "auto",
  },
});

const deleteButtonClass = css({
  position: "absolute",
  top: "8px",
  right: "8px",
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: "full",
  border: "none",
  bg: "black/60",
  color: "white",
  cursor: "pointer",
  transition: "opacity 150ms ease, background-color 150ms ease",
  _hover: { bg: "red.9" },
  _focusVisible: { opacity: 1, outline: "2px solid", outlineColor: "white" },
});
