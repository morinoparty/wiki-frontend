import { createFileRoute } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { LoginModal } from "@/components/LoginModal";
import { ModalDialogRoot } from "@/components/ModalDialogRoot";
import { pageTitle } from "@/lib/pageTitle";

export const Route = createFileRoute("/_normal/auth/sign-in")({
  head: () => ({
    meta: [
      { title: pageTitle("サインイン") },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  return (
    // isPage の地色は chlorophyll では colorPalette.bg になるため、
    // 従来どおり淡いブランド面を敷き直す
    <ModalDialogRoot isPage className={css({ bg: "colorPalette.surface" })}>
      <LoginModal />
    </ModalDialogRoot>
  );
}
