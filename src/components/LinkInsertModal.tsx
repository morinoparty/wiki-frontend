"use client";

import React, { useState, useEffect } from "react";
import { X, Link, Check } from "lucide-react";
import { css } from "styled-system/css";
import { toaster } from "@/components/ui/toaster";

interface LinkInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkInsert: (url: string, text: string) => void;
  selectedText?: string;
}

export const LinkInsertModal: React.FC<LinkInsertModalProps> = ({
  isOpen,
  onClose,
  onLinkInsert,
  selectedText = "",
}) => {
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // モーダルが開かれた時に選択テキストを設定
  useEffect(() => {
    if (isOpen) {
      setLinkText(selectedText);
      setLinkUrl("");
    }
  }, [isOpen, selectedText]);

  // モーダルを閉じる
  const handleClose = () => {
    setLinkText("");
    setLinkUrl("");
    onClose();
  };

  // リンクを挿入
  const handleInsert = () => {
    if (!linkUrl.trim()) {
      toaster.error({
        title: "エラー",
        description: "URLを入力してください",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    if (!linkText.trim()) {
      toaster.error({
        title: "エラー",
        description: "リンクテキストを入力してください",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    onLinkInsert(linkUrl.trim(), linkText.trim());
    handleClose();
  };

  // Escキーでモーダルを閉じる
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
    if (e.key === "Enter" && e.ctrlKey) {
      handleInsert();
    }
  };

  // バックドロップクリックでモーダルを閉じる
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={css({
        position: "fixed",
        inset: 0,
        bg: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
      })}
      onClick={handleOverlayClick}
    >
      <div
        className={css({
          bg: "white",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "90vh",
          overflow: "hidden",
          position: "relative",
          animation: "modal-enter 0.2s ease-out",
        })}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* ヘッダー */}
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 24px 0 24px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "20px",
            marginBottom: "24px",
          })}
        >
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "12px",
            })}
          >
            <div
              className={css({
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Link size={20}/>
            </div>
            <div>
              <h2
                className={css({
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "colorPalette.fg",
                  lineHeight: "1.2",
                })}
              >
                リンクを挿入
              </h2>
              <p
                className={css({
                  fontSize: "14px",
                  color: "colorPalette.fg.subtle",
                  marginTop: "2px",
                })}
              >
                {selectedText
                  ? "選択したテキストにリンクを追加"
                  : "新しいリンクを作成"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={css({
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "none",
              bg: "#f8faf9",
              color: "colorPalette.fg.subtle",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            })}
          >
            <X size={16} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className={css({ padding: "0 24px 24px 24px" })}>
          {/* リンクテキスト入力 */}
          <div className={css({ marginBottom: "20px" })}>
            <label
              className={css({
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "colorPalette.fg",
                marginBottom: "8px",
              })}
              htmlFor="linkText"
            >
              リンクテキスト
            </label>
            <input
              id="linkText"
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="表示するテキストを入力"
              autoFocus
              className={css({
                width: "100%",
                padding: "12px 16px",
                border: "1px solid token(colors.border.subtle)",
                borderRadius: "8px",
                fontSize: "14px",
                color: "colorPalette.fg",
                bg: "white",
                outline: "none",
                transition: "all 0.2s",
                "&:focus": {
                  borderColor: "colorPalette.border",
                  boxShadow: "0 0 0 3px rgba(52, 126, 94, 0.1)",
                },
                "&::placeholder": {
                  color: "#94a3b8",
                },
              })}
            />
          </div>

          {/* URL入力 */}
          <div className={css({ marginBottom: "24px" })}>
            <label
              className={css({
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "colorPalette.fg",
                marginBottom: "8px",
              })}
              htmlFor="linkUrl"
            >
              URL
            </label>
            <input
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className={css({
                width: "100%",
                padding: "12px 16px",
                border: "1px solid token(colors.border.subtle)",
                borderRadius: "8px",
                fontSize: "14px",
                color: "colorPalette.fg",
                bg: "white",
                outline: "none",
                transition: "all 0.2s",
                "&:focus": {
                  borderColor: "colorPalette.border",
                  boxShadow: "0 0 0 3px rgba(52, 126, 94, 0.1)",
                },
                "&::placeholder": {
                  color: "#94a3b8",
                },
              })}
            />
          </div>

          {/* プレビュー */}
          {linkText && linkUrl && (
            <div className={css({ marginBottom: "24px" })}>
              <label
                className={css({
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "colorPalette.fg",
                  marginBottom: "8px",
                })}
              >
                プレビュー
              </label>
              <div
                className={css({
                  padding: "12px 16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  bg: "#f8fafc",
                  fontSize: "14px",
                })}
              >
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css({
                    color: "colorPalette.fg",
                    textDecoration: "underline",
                    "&:hover": {
                      color: "colorPalette.fg",
                    },
                  })}
                >
                  {linkText}
                </a>
              </div>
            </div>
          )}

          {/* ショートカットヒント */}
          <div
            className={css({
              fontSize: "12px",
              color: "#64748b",
              marginBottom: "20px",
              textAlign: "center",
            })}
          >
            Ctrl + Enter で挿入
          </div>

          {/* アクションボタン */}
          <div className={css({ display: "flex", gap: "12px" })}>
            <button
              onClick={handleClose}
              className={css({
                flex: 1,
                padding: "12px 24px",
                border: "1px solid token(colors.border.subtle)",
                borderRadius: "8px",
                bg: "white",
                color: "colorPalette.fg.subtle",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  bg: "#fafcfb",
                  borderColor: "border.muted",
                },
              })}
            >
              キャンセル
            </button>
            <button
              onClick={handleInsert}
              disabled={!linkText.trim() || !linkUrl.trim()}
              className={css({
                flex: 2,
                padding: "12px 24px",
                border: "none",
                borderRadius: "8px",
                bg: "colorPalette.solid",
                color: "white",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                "&:hover": {
                  bg: "colorPalette.solid.emphasized",
                },
                "&:disabled": {
                  opacity: 0.5,
                  cursor: "not-allowed",
                  "&:hover": {
                    bg: "colorPalette.solid",
                  },
                },
              })}
            >
              <Check size={16} />
              リンクを挿入
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
