"use client";

import { Editable, IconButton } from "@chakra-ui/react";
import { Tag, ImagePlus } from "lucide-react";
import { postHeaderStyles } from "./PostHeader";
import { css, cx } from "styled-system/css";
import { useRef } from "react";
import { uploadImage } from "@/actions/upload-image";

interface PostHeaderEditProps {
  image?: string;
  category: string;
  title: string;
  description: string;
  onChange?: (fields: {
    title: string;
    description: string;
    category: string;
    image?: string;
  }) => void;
  disabled?: boolean;
}

export function PostHeaderEdit({
  image,
  category,
  title,
  description,
  onChange,
  disabled,
}: PostHeaderEditProps) {
  const classes = postHeaderStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chakra Editable v2: onValueChange/Commit receives { value: string }
  const handleCategoryChange = (details: { value: string }) => {
    onChange?.({ title, description, category: details.value });
  };
  const handleTitleChange = (details: { value: string }) => {
    onChange?.({ title: details.value, description, category });
  };
  const handleDescriptionChange = (details: { value: string }) => {
    onChange?.({ title, description: details.value, category });
  };

  // 画像アップロードボタンのクリック
  const handleImageIconClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };
  // 画像選択時の処理（親でonChange拡張する場合はここで渡す）
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onChange) {
      const result = await uploadImage(file);
      if (!result.success || !result.data) return;
      onChange({
        title,
        description,
        category,
        image: result.data.url,
      });
    }
  };

  return (
    <header
      className={cx(
        classes.container,
        css({
          bg: "white",
          borderBottom: "0px solid",
          pt: "53px",
        })
      )}
    >
      {image && (
        <div
          className={classes.image}
          style={{
            backgroundImage: `url(${
              "https://wiki-contentdev.yahiro.workers.dev/" + image
            })`,
            position: "relative",
          }}
        >
          <IconButton
            aria-label="画像をアップロード"
            onClick={handleImageIconClick}
            className={css({
              position: "absolute",
              right: "24px",
              bottom: "24px",
              background: "rgba(255,255,255,0.8)",
              border: "none",
              borderRadius: "full",
              p: "2",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              _hover: { background: "leaf.100" },
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              color: "leaf.600",
            })}
            disabled={disabled}
          >
            <ImagePlus size={24} />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
            disabled={disabled}
          />
        </div>
      )}

      <div className={cx(classes.info, css({ pt: "96px", pb: "16px" }))}>
        <div className={cx(classes.category, css({ mb: "24px !important" }))}>
          <Tag width={16} />
          <Editable.Root
            value={category}
            onValueChange={handleCategoryChange}
            disabled={disabled}
            selectOnFocus
            placeholder="カテゴリ"
            size="md"
          >
            <Editable.Preview />
            <Editable.Input />
          </Editable.Root>
        </div>
        <Editable.Root
          value={title}
          onValueChange={handleTitleChange}
          disabled={disabled}
          selectOnFocus
          placeholder="タイトル"
          size="lg"
        >
          <Editable.Preview
            className={cx(
              classes.title,
              css({ px: "0", py: "0", margin: "0" })
            )}
          />
          <Editable.Textarea
            className={cx(
              classes.title,
              css({ px: "0", py: "0", margin: "0", fieldSizing: "content" })
            )}
          />
        </Editable.Root>
        <Editable.Root
          value={description}
          onValueChange={handleDescriptionChange}
          disabled={disabled}
          selectOnFocus
          placeholder="説明"
          size="md"
          autoResize={false}
        >
          <Editable.Preview
            className={cx(
              classes.description,
              css({ px: "0", py: "0", margin: "0" })
            )}
          />
          <Editable.Input
            className={cx(
              classes.description,
              css({ px: "0", py: "0", margin: "0", fieldSizing: "content" })
            )}
          />
        </Editable.Root>
      </div>
    </header>
  );
}
