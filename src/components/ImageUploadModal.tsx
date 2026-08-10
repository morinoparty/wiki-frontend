"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Upload, Image, Check } from "lucide-react";
import { css, cx } from "styled-system/css";
import { uploadImage } from "@/actions/upload-image";
import { toaster } from "@/components/ui/toaster";

// 定数
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const TOAST_DURATION = {
  DEFAULT: 3000,
  ERROR: 5000,
};

interface ImageUploadModalProps {
  /** 編集中の記事の uuid。画像は記事の assets 配下に保存される。 */
  articleId: string;
  isOpen: boolean;
  onClose: () => void;
  onImageInsert: (imageUrl: string, altText?: string) => void;
  editingImage?: { src: string; alt: string } | null;
}

export function ImageUploadModal({ articleId, isOpen, onClose, onImageInsert, editingImage }: ImageUploadModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 編集モードの初期化
  useEffect(() => {
    if (editingImage && isOpen) {
      console.log("編集モードで初期化:", editingImage);
      setIsEditMode(true);
      setPreviewUrl(editingImage.src);
      setAltText(editingImage.alt);
      setSelectedFile(null); // 編集モードでは新ファイルなし
    } else if (isOpen) {
      // 新規追加モード
      console.log("新規追加モードで初期化");
      setIsEditMode(false);
    }
  }, [editingImage, isOpen]);

  /**
   * ファイルのバリデーション
   */
  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toaster.error({
        title: "エラー",
        description: "JPEG、PNG、GIF、WebP形式の画像ファイルのみアップロード可能です",
        duration: TOAST_DURATION.ERROR,
        meta: { closable: true },
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toaster.error({
        title: "エラー",
        description: "ファイルサイズは5MB以下にしてください",
        duration: TOAST_DURATION.ERROR,
        meta: { closable: true },
      });
      return false;
    }

    return true;
  };

  /**
   * ファイルをbase64に変換
   */
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * ファイル処理
   */
  const handleFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    try {
      const base64 = await convertToBase64(file);
      setPreviewUrl(base64);
      setSelectedFile(file);
      setAltText(file.name.replace(/\.[^/.]+$/, "")); // 拡張子を除いたファイル名をalt textに
    } catch (error) {
      console.error("ファイル読み込みエラー:", error);
      toaster.error({
        title: "エラー",
        description: "ファイルの読み込みに失敗しました",
        duration: TOAST_DURATION.ERROR,
        meta: { closable: true },
      });
    }
  }, []);

  /**
   * ドラッグ&ドロップ処理
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  /**
   * ファイル選択処理
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  /**
   * アップロード/更新処理
   */
  const handleUpload = async () => {
    // 編集モードで画像ファイルの変更がない場合は、alt textのみ更新
    if (isEditMode && !selectedFile && editingImage) {
      console.log("Alt textのみ更新:", { url: editingImage.src, altText });
      
      // 成功通知
      toaster.success({
        title: "成功",
        description: "画像情報が更新されました",
        duration: TOAST_DURATION.DEFAULT,
        meta: { closable: true },
      });

      // 画像情報を更新
      onImageInsert(editingImage.src, altText);
      handleClose();
      return;
    }

    // 新しいファイルがある場合はアップロード
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // プログレスアニメーション
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const result = await uploadImage(selectedFile, articleId);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success || !result.data) {
        throw new Error(result.error || "アップロードに失敗しました");
      }

      // 成功通知
      toaster.success({
        title: "成功",
        description: isEditMode ? "画像が正常に更新されました" : "画像が正常にアップロードされました",
        duration: TOAST_DURATION.DEFAULT,
        meta: { closable: true },
      });

      // 画像を挿入/更新
      console.log("About to call onImageInsert with:", { url: result.data.url, altText });
      onImageInsert(result.data.url, altText);
      handleClose();

    } catch (error) {
      console.error("アップロードエラー:", error);
      setUploadProgress(0);
      toaster.error({
        title: "エラー",
        description: isEditMode ? "画像の更新に失敗しました" : "アップロードに失敗しました",
        duration: TOAST_DURATION.ERROR,
        meta: { closable: true },
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * モーダルを閉じる
   */
  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setAltText("");
    setUploadProgress(0);
    setIsUploading(false);
    setIsDragOver(false);
    setIsEditMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  /**
   * ファイル選択ボタンクリック
   */
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
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
      onClick={handleClose}
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
          <div className={css({ display: "flex", alignItems: "center", gap: "12px" })}>
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
              <Image size={20} className={css({ color: "colorPalette.fg" })} />
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
{isEditMode ? "画像を編集" : "画像をアップロード"}
              </h2>
              <p
                className={css({
                  fontSize: "14px",
                  color: "colorPalette.fg.subtle",
                  marginTop: "2px",
                })}
              >
                JPEG、PNG、GIF、WebP (最大5MB)
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
          {!previewUrl ? (
            /* アップロードエリア */
            <div
              className={cx(
                css({
                  border: "2px dashed token(colors.border.subtle)",
                  borderRadius: "12px",
                  padding: "40px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  bg: "#fafcfb",
                  position: "relative",
                  "&:hover": {
                    borderColor: "border.muted",
                    bg: "#f5faf7",
                  },
                }),
                isDragOver &&
                  css({
                    borderColor: "colorPalette.border",
                    transform: "scale(1.02)",
                  })
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleFileButtonClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={css({ display: "none" })}
              />

              <div
                className={css({
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                })}
              >
                <Upload size={32} className={css({ color: "colorPalette.fg" })} />
              </div>

              <h3
                className={css({
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "colorPalette.fg",
                  marginBottom: "8px",
                })}
              >
                ここに画像をドロップ
              </h3>
              <p
                className={css({
                  fontSize: "14px",
                  color: "colorPalette.fg.subtle",
                  marginBottom: "16px",
                })}
              >
                または、クリックしてファイルを選択
              </p>

              <div
                className={css({
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  bg: "colorPalette.solid",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  "&:hover": {
                    bg: "colorPalette.solid.emphasized",
                  },
                })}
              >
                <Upload size={16} />
                ファイルを選択
              </div>
            </div>
          ) : (
            /* プレビューエリア */
            <div>
              <div
                className={css({
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  overflow: "hidden",
                  marginBottom: "20px",
                })}
              >
                <img
                  src={previewUrl}
                  alt="画像プレビュー"
                  className={css({
                    width: "100%",
                    height: "240px",
                    objectFit: "cover",
                    display: "block",
                  })}
                />
              </div>

              {/* Alt Text入力 */}
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
                  代替テキスト (Alt Text)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="画像の説明を入力してください"
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
                  })}
                />
              </div>

              {/* アップロードプログレス */}
              {isUploading && (
                <div className={css({ marginBottom: "20px" })}>
                  <div
                    className={css({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    })}
                  >
                    <span className={css({ fontSize: "14px", color: "colorPalette.fg.subtle" })}>
                      アップロード中...
                    </span>
                    <span className={css({ fontSize: "14px", color: "colorPalette.fg.subtle" })}>
                      {uploadProgress}%
                    </span>
                  </div>
                  <div
                    className={css({
                      width: "100%",
                      height: "6px",
                      borderRadius: "3px",
                      overflow: "hidden",
                    })}
                  >
                    <div
                      className={css({
                        height: "100%",
                        bg: "colorPalette.solid",
                        transition: "width 0.3s ease",
                        borderRadius: "3px",
                      })}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className={css({ display: "flex", gap: "12px" })}>
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    setAltText("");
                  }}
                  disabled={isUploading}
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
                    "&:disabled": {
                      opacity: 0.5,
                      cursor: "not-allowed",
                    },
                  })}
                >
                  画像を変更
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
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
                      opacity: 0.7,
                      cursor: "not-allowed",
                    },
                  })}
                >
                  {isUploading ? (
                    <>
                      <div
                        className={css({
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(255, 255, 255, 0.3)",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        })}
                      />
                      アップロード中...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {isEditMode ? "変更を保存" : "画像を挿入"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}