import { LoginModal } from "@/components/LoginModal";
import { ModalDialogRoot } from "@/components/ModalDialogRoot";
import { css } from "styled-system/css";

export default async function Home() {
  return (
    // isPage の地色は chlorophyll では colorPalette.bg になるため、
    // 従来どおり leaf.100 を敷き直す
    <ModalDialogRoot isPage className={css({ bg: "leaf.100" })}>
      <LoginModal />
    </ModalDialogRoot>
  );
}
