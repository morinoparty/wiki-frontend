"use client";

import { css } from "styled-system/css";
import { useEffect } from "react";

export const LoginModalWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      className={css({
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
      })}
      style={{
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          window.history.back();
        }
      }}
    >
      {children}
    </div>
  );
};
