import { createFileRoute } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { LoginModal } from "@/components/LoginModal";
import { ModalDialog } from "@morinoparty/chlorophyll-react/components";
import { pageTitle } from "@/lib/pageTitle";
import { toSafeRedirectPath } from "@/server/types";

export const Route = createFileRoute("/_normal/auth/sign-in")({
  // ログイン後の戻り先 (未ログインでダッシュボードを開いたときに付く)。
  // サイト外の URL は `/` に置き換える
  validateSearch: (search: Record<string, unknown>): { redirect: string } => ({
    redirect: toSafeRedirectPath(search.redirect),
  }),
  head: () => ({
    meta: [
      { title: pageTitle("サインイン") },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { redirect } = Route.useSearch();
  return (
    // isPage の地色は chlorophyll では colorPalette.bg になるため、
    // 従来どおり淡いブランド面を敷き直す
    <ModalDialog.Root isPage className={css({ bg: "colorPalette.surface" })}>
      <LoginModal redirectTo={redirect} />
    </ModalDialog.Root>
  );
}
