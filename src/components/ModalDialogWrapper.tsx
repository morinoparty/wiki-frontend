"use client";

import { sva } from "styled-system/css";
import { useEffect } from "react";

const modalDialogWrapperStyles = sva({
  slots: ["overlay"],
  base: {
    overlay: {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      bg: "leaf.600/50",
      zIndex: "200000000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(4px)",
      ...{
        "backdrop-filter": "blur(4px)",
      },
    },
  },
  variants: {
    isPage: {
      true: {
        overlay: {
          position: "static",
          width: "auto",
          height: "100vh",
          bg: "leaf.100",
          zIndex: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backdropFilter: "none",
        },
      },
    },
  },
});

export const ModalDialogWrapper: React.FC<{
  children: React.ReactNode;
  isPage?: boolean;
}> = ({ children, isPage = false }) => {
  const styles = modalDialogWrapperStyles({ isPage });

  useEffect(() => {
    if (!isPage) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isPage]);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (!isPage && e.target === e.currentTarget) {
          window.history.back();
        }
      }}
    >
      {children}
    </div>
  );
};
