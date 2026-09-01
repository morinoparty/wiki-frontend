import type { Metadata } from "next";
import { LoginModal } from "@/components/LoginModal";
import { ModalDialogRoot } from "@/components/ModalDialogRoot";
import { css } from "styled-system/css";

export const metadata: Metadata = {
  title: "サインイン",
  robots: { index: false, follow: false },
};

export default async function Home() {
  return (
    // isPage の地色は chlorophyll では colorPalette.bg になるため、
    // 従来どおり淡いブランド面を敷き直す
    <ModalDialogRoot isPage className={css({ bg: "colorPalette.surface" })}>
      <LoginModal />
    </ModalDialogRoot>
  );
}
