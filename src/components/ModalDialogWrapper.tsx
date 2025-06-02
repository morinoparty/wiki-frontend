"use client";

import { sva } from "styled-system/css";
import { useEffect, useState, useRef } from "react";

const modalDialogWrapperStyles = sva({
  slots: ["overlay", "content"],
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
      animation: "fade-in 0.25s ease-in-out",
      animationFillMode: "both",
      willChange: "opacity",
      ...{
        "backdrop-filter": "blur(4px)",
      },
    },
    content: {
      animation: "fade-in 0.25s ease-in-out, scale-in 0.25s ease-in-out",
      animationFillMode: "both",
      transformOrigin: "center",
      willChange: "opacity, transform",
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
          animation: "none",
        },
        content: {
          animation: "none",
        },
      },
    },
    isExiting: {
      true: {
        overlay: {
          animation: "fade-out 0.2s ease-in",
          animationFillMode: "forwards",
        },
        content: {
          animation: "fade-out 0.2s ease-in",
          animationFillMode: "forwards",
        },
      },
    },
  },
});

export const ModalDialogWrapper: React.FC<{
  children: React.ReactNode;
  isPage?: boolean;
}> = ({ children, isPage = false }) => {
  const [isExiting, setIsExiting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const styles = modalDialogWrapperStyles({ isPage, isExiting });

  useEffect(() => {
    if (!isPage) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isPage]);

  useEffect(() => {
    if (isExiting && overlayRef.current) {
      const overlay = overlayRef.current;
      let hasNavigated = false;

      const handleAnimationEnd = (event: AnimationEvent) => {
        // overlayの直接のアニメーションのみを処理し、重複実行を防ぐ
        if (event.target === overlay && !hasNavigated) {
          hasNavigated = true;
          window.history.back();
        }
      };

      overlay.addEventListener("animationend", handleAnimationEnd);

      return () => {
        overlay.removeEventListener("animationend", handleAnimationEnd);
      };
    }
  }, [isExiting]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isPage && e.target === e.currentTarget) {
      setIsExiting(true);
    }
  };

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleOverlayClick}
    >
      <div className={styles.content}>{children}</div>
    </div>
  );
};
