import { createFileRoute } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { LoginModal } from "@/components/LoginModal";
import { ModalDialog } from "@morinoparty/chlorophyll-react/components";
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
    <ModalDialog.Root isPage className={css({ bg: "colorPalette.surface" })}>
      <LoginModal />
    </ModalDialog.Root>
  );
}
