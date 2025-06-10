"use client";

import { 
  insertTable$, 
  usePublisher, 
  useTranslation 
} from "@mdxeditor/editor";
import { Table } from "lucide-react";
import { FC } from "react";

const TableInsert: FC = () => {
  const insertTable = usePublisher(insertTable$);
  const t = useTranslation();

  return (
    <button
      onClick={() => {
        console.log("テーブル挿入ボタンクリック");
        insertTable({
          rows: 3,
          columns: 3,
        });
      }}
      type="button"
      title={t("toolbar.table", "テーブルを挿入")}
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
      <Table size={16} aria-label="テーブルを挿入" />
    </button>
  );
};

export default TableInsert;