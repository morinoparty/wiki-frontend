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
} from "@mdxeditor/editor";

import { FC } from "react";
import { css } from "styled-system/css";

interface EditorProps {
  markdown: string;
  editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
  onChange: (markdown: string) => void;
}

/**
 * Extend this Component further with the necessary plugins or props you need.
 * proxying the ref is necessary. Next.js dynamically imported components don't support refs.
 */
const Editor: FC<EditorProps> = ({ markdown, editorRef, onChange }) => {
  console.log("Editor rendered", { markdown });

  return (
    <>
      <MDXEditor
        onChange={onChange}
        ref={editorRef}
        markdown={markdown}
        onError={(e) => console.error("Editor error", e)}
        suppressHtmlProcessing={true}
        plugins={[
          headingsPlugin(),
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
            imageUploadHandler: () => {
              return Promise.resolve("https://picsum.photos/200/300");
            },
            imagePreviewHandler: (url) => {
              return Promise.resolve(
                "https://wiki-contentdev.yahiro.workers.dev/" + url
              );
            },
            imageAutocompleteSuggestions: [
              "https://picsum.photos/200/300",
              "https://picsum.photos/200",
            ],
          }),
          toolbarPlugin({
            toolbarClassName: css({
              position: "sticky",
              top: "64px",
              width: "100%",
              bg: "white",
              padding: "16px",
              py: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "row",
              gap: "12px",
              borderBottom: "1px solid",
              borderColor: "leaf.100",
              "& > ul > div ": {
                display: "flex",
                height: "36px",

                "& > div": {
                  height: "36px",
                  px: "6px",
                  py: "6px",
                },
              },
            }),
            toolbarContents: () => (
              <>
                <ul
                  className={css({
                    display: "flex",
                    gap: "12px",
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                  })}
                >
                  <li
                    className={css({
                      "& button": {
                        background: "transparent",
                        cursor: "pointer",
                        gap: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "36px",
                        pl: "18px",
                        pr: "8px",
                        bg: "leaf.50/50",
                        textStyle: "body",
                        borderRadius: "8px",
                        border: "0.5px solid",
                        borderColor: "leaf.100",
                        transition: "all 0.4s",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      },
                    })}
                  >
                    <BlockTypeSelect />
                  </li>
                  <li
                    className={css({
                      "& div": {
                        display: "flex",
                        gap: "2px",
                      },

                      "& button": {
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
                        "&:hover": {
                          bg: "leaf.50/50",
                          textDecoration: "underline",
                        },
                        "&:active": {
                          bg: "leaf.50",
                        },
                      },
                    })}
                  >
                    <BoldItalicUnderlineToggles />
                  </li>
                </ul>
                <ul>
                  <li
                    className={css({
                      "& div": {
                        display: "flex",
                        gap: "2px",
                      },

                      "& button": {
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
                        "&:hover": {
                          bg: "leaf.50/50",
                          textDecoration: "underline",
                        },
                        "&:active": {
                          bg: "leaf.50",
                        },
                      },
                    })}
                  >
                    <UndoRedo />
                  </li>
                </ul>
              </>
            ),
          }),
          markdownShortcutPlugin(),
        ]}
        className={css({
          bg: "white",
        })}
        contentEditableClassName={css({
          px: { base: "92px", lgDown: "24px" },
          pt: "48px",
          pb: "300px",
          outline: "none",
          maxWidth: "980px",
          margin: "0 auto",
          // mdxStylesからインポートする方法を色々試したが、スタイルを適応できなかったため、ベタがきしている
          "& p": {
            textStyle: "body",
            color: "leaf.700",
            lineHeight: "1.85",
            my: "24px",
            _first: { mt: "0" },
          },
          "& h1": {
            fontSize: "32px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading1",
            mt: "56px",
            mb: "32px",
          },
          "& h2": {
            fontSize: "28px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading2",
            mt: "56px",
            mb: "32px",
          },
          "& h3": {
            fontSize: "24px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "body",
            mt: "48px",
            mb: "12px",
          },
          "& h4": {
            fontSize: "20px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading4",
            mt: "24px",
            mb: "10px",
          },
          "& h5": {
            fontSize: "18px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading5",
            mt: "18px",
            mb: "8px",
          },
          "& h6": {
            fontSize: "16px",
            fontWeight: "bold",
            color: "leaf.700",
            textStyle: "heading6",
            mt: "16px",
            mb: "6px",
          },
          "& ul": {
            pl: "24px",
            my: "16px",
            listStyle: "disc inside",
            textStyle: "body",
          },
          "& ol": {
            pl: "24px",
            my: "16px",
            listStyle: "decimal inside",
            textStyle: "body",
          },
          "& li": {
            mb: "8px",
            textStyle: "body",
          },
          "& a": {
            color: "blue.600",
            textDecoration: "underline",
            textStyle: "body",
            _hover: { color: "blue.800" },
          },
          "& blockquote": {
            borderLeft: "4px solid #A3C9A8",
            pl: "16px",
            color: "gray.700",
            fontStyle: "italic",
            my: "16px",
            textStyle: "body",
          },
          "& code": {
            background: "gray.100",
            color: "gray.800",
            px: "4px",
            py: "2px",
            borderRadius: "4px",
            fontSize: "0.95em",
            textStyle: "body",
          },
          "& pre": {
            background: "gray.100",
            color: "gray.800",
            px: "16px",
            py: "12px",
            borderRadius: "8px",
            overflowX: "auto",
            my: "16px",
            textStyle: "body",
          },
          "& img": {
            maxWidth: "100%",
            borderRadius: "8px",
            margin: "16px 0",
          },
          "& hr": {
            border: "none",
            borderTop: "1px solid #E2E8F0",
            my: "32px",
          },
          "& table": {
            width: "100%",
            borderCollapse: "collapse",
            my: "24px",
            textStyle: "body",
          },
          "& thead": {
            background: "gray.50",
          },
          "& tr": {
            borderBottom: "1px solid #E2E8F0",
          },
          "& th": {
            fontWeight: "bold",
            textAlign: "left",
            px: "12px",
            py: "8px",
            background: "gray.100",
            textStyle: "body",
          },
          "& td": {
            px: "12px",
            py: "8px",
            textStyle: "body",
          },
        })}
      />
    </>
  );
};

export default Editor;
