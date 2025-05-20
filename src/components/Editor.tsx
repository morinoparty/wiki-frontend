"use client";

import { css } from "styled-system/css";

export default function Editor({
  md = "",
  onChange,
}: {
  md?: string;
  onChange?: (md: string) => void;
}) {
  return (
    <div
      className={css({
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        display: "grid",
      })}
    >
      <textarea
        value={md}
        onChange={(e) => onChange?.(e.target.value)}
        className={css({
          // field
          width: "100%",
          maxWidth: "100%",
          minHeight: "300px",
          fieldSizing: "content",
        })}
      />
    </div>
  );
}
