import { LoginModal } from "@/components/LoginModal";
import { css } from "styled-system/css";

export default async function Home() {
  return (
    <div
      className={css({
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgColor: "leaf.100",
      })}
    >
      <LoginModal />
    </div>
  );
}
