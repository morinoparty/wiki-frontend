"use client";

// import { Editor, rootCtx } from "@milkdown/kit/core";
import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import React from "react";

import "@milkdown/crepe/theme/common/style.css";
import "./milkdown-panda-colors.css";
import { css } from "styled-system/css";

const CrepeEditor: React.FC<{
  root?: Node | string | null;
  defaultValue?: string;
  features?: Partial<Record<string, boolean>>;
  featureConfigs?: Record<string, unknown>;
}> = ({ defaultValue = "Hello World", features = {}, featureConfigs = {} }) => {
  useEditor((root) => {
    return new Crepe({
      root: root,
      defaultValue: defaultValue,
      features,
      featureConfigs,
    });
  });

  return <Milkdown />;
};

export const MilkdownEditor: React.FC<{
  root?: Node | string | null;
  defaultValue?: string;
  features?: Partial<Record<string, boolean>>;
  featureConfigs?: Record<string, unknown>;
}> = ({ root, defaultValue, features, featureConfigs }) => {
  return (
    <MilkdownProvider>
      <div
        className={css({
          "& .ProseMirror": {
            padding: "0px !important",
            maxWidth: "800px !important",
            mx: "auto !important",
            // ベースのテキスト色
            color: "leaf.700",
            fontSize: "16px",
            lineHeight: "1.85",

            outline: "none",
          },
          // 段落
          "& .ProseMirror p": {
            textStyle: "body",
            color: "leaf.700",
            lineHeight: "1.85",
            margin: "24px 0",
          },
          // 見出し
          "& .ProseMirror h1": {
            fontSize: "32px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading1",
            margin: "56px 0 32px 0",
          },
          "& .ProseMirror h2": {
            fontSize: "28px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading2",
            margin: "56px 0 32px 0",
          },
          "& .ProseMirror h3": {
            fontSize: "24px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "body",
            margin: "48px 0 12px 0",
          },
          "& .ProseMirror h4": {
            fontSize: "20px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading4",
            margin: "24px 0 10px 0",
          },
          "& .ProseMirror h5": {
            fontSize: "18px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading5",
            margin: "18px 0 8px 0",
          },
          "& .ProseMirror h6": {
            fontSize: "16px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading6",
            margin: "16px 0 6px 0",
          },
          // リスト
          "& .ProseMirror ul": {
            paddingLeft: "24px",
            margin: "16px 0",
            listStyle: "disc inside",
            textStyle: "body",
          },
          "& .ProseMirror ol": {
            paddingLeft: "24px",
            margin: "16px 0",
            listStyle: "decimal inside",
            textStyle: "body",
          },
          "& .ProseMirror li": {
            marginBottom: "8px",
            textStyle: "body",
          },
          // リンク
          "& .ProseMirror a": {
            color: "blue.600",
            textDecoration: "underline",
            textStyle: "body",
            cursor: "pointer",
            transition: "color 0.2s",
          },
          "& .ProseMirror a:hover": {
            color: "blue.800",
          },
          // 引用
          "& .ProseMirror blockquote": {
            borderLeft: "4px solid #A3C9A8",
            paddingLeft: "16px",
            color: "gray.700",
            fontStyle: "italic",
            margin: "16px 0",
            textStyle: "body",
          },
          // コード
          "& .ProseMirror code": {
            background: "gray.100",
            color: "gray.800",
            padding: "2px 4px",
            borderRadius: "4px",
            fontSize: "0.95em",
            textStyle: "body",
          },
          "& .ProseMirror pre": {
            background: "gray.100",
            color: "gray.800",
            padding: "12px 16px",
            borderRadius: "8px",
            overflowX: "auto",
            margin: "16px 0",
            textStyle: "body",
          },
          // 画像
          "& .ProseMirror img": {
            maxWidth: "100%",
            borderRadius: "8px",
            margin: "16px 0",
          },
          // 水平線
          "& .ProseMirror hr": {
            border: "none",
            borderTop: "1px solid #E2E8F0",
            margin: "32px 0",
          },
          // テーブル
          "& .ProseMirror table": {
            width: "100%",
            borderCollapse: "collapse",
            margin: "24px 0",
            textStyle: "body",
          },
          "& .ProseMirror thead": {
            background: "gray.50",
          },
          "& .ProseMirror tr": {
            borderBottom: "1px solid #E2E8F0",
          },
          "& .ProseMirror th": {
            fontWeight: "bold",
            textAlign: "left",
            padding: "8px 12px",
            background: "gray.100",
            textStyle: "body",
          },
          "& .ProseMirror td": {
            padding: "8px 12px",
            textStyle: "body",
          },
        })}
      >
        <CrepeEditor
          root={root}
          features={features}
          featureConfigs={featureConfigs}
          defaultValue={defaultValue}
        />
      </div>
    </MilkdownProvider>
  );
};
