import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import Layout from "@/components/Layout";
import { NotFound } from "@/components/NotFound";
import { Sidebar } from "@/components/Sidebar";
import { SidebarContentNormal } from "@/components/SidebarContent";
import { Provider } from "@/components/ui/provider";
import { pageTitle } from "@/lib/pageTitle";
import { fetchSessionUser, type SessionUser } from "@/server/session";
import globalsCss from "@/styles/globals.css?url";

export interface RouterContext {
  /** ログイン中のユーザー。未ログインなら null。root の beforeLoad で解決する。 */
  user: SessionUser | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => ({ user: await fetchSessionUser() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: pageTitle() },
      {
        name: "description",
        content:
          "もりのパーティ公式Wiki「もりぱうぃき!」は、もりのパーティに関する情報を集約するためのコミュニティWikiです。Minecraftコミュニティ「もりのパーティ」に参加したことがあれば、すぐに使い始めることができます。",
      },
    ],
    links: [
      { rel: "stylesheet", href: globalsCss },
      { rel: "icon", href: "/favicon.ico" },
      {
        rel: "stylesheet",
        type: "text/css",
        href: "https://shogo82148.github.io/genjyuugothic-subsets/GenJyuuGothicL-P-Medium/GenJyuuGothicL-P-Medium.css",
      },
      {
        rel: "stylesheet",
        type: "text/css",
        href: "https://shogo82148.github.io/genjyuugothic-subsets/GenJyuuGothicL-P-Bold/GenJyuuGothicL-P-Bold.css",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: RootNotFound,
});

function RootComponent() {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Provider>
          <Outlet />
        </Provider>
        <Scripts />
      </body>
    </html>
  );
}

/**
 * どのルートにも一致しない URL の 404。公開ページのレイアウトの外なので
 * ここでレイアウトを組む (カテゴリは読まない)。
 */
function RootNotFound() {
  return (
    <Layout
      sidebar={
        <Sidebar>
          <SidebarContentNormal categories={[]} />
        </Sidebar>
      }
    >
      <NotFound />
    </Layout>
  );
}
