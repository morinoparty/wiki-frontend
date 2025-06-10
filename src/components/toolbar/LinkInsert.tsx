"use client";

import { 
  useTranslation,
  editorRootElementRef$,
  useCellValues
} from "@mdxeditor/editor";
import { Link } from "lucide-react";
import { FC } from "react";

interface LinkInsertProps {
  onOpenModal: (selectedText: string) => void;
}

const LinkInsert: FC<LinkInsertProps> = ({ onOpenModal }) => {
  const t = useTranslation();
  const [editorRootElementRef] = useCellValues(editorRootElementRef$);

  // 選択されたテキストを取得する関数
  const getSelectedText = (): string => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return "";
      }

      const selectedText = selection.toString().trim();
      
      // エディター内の選択かどうかを確認
      if (editorRootElementRef?.current) {
        const range = selection.getRangeAt(0);
        const isWithinEditor = editorRootElementRef.current.contains(range.commonAncestorContainer);
        
        if (isWithinEditor && selectedText) {
          console.log("エディター内の選択テキスト:", selectedText);
          return selectedText;
        }
      }
      
      return "";
    } catch (error) {
      console.error("選択テキスト取得エラー:", error);
      return "";
    }
  };

  const handleClick = () => {
    console.log("リンク挿入ボタンクリック");
    const selectedText = getSelectedText();
    console.log("取得した選択テキスト:", selectedText);
    onOpenModal(selectedText);
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      title={t("toolbar.link", "リンクを作成")}
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
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <Link size={16} aria-label="リンクを作成" />
    </button>
  );
};

export default LinkInsert;