import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { SidebarContentDashboard } from "@/components/SidebarContent";

// ダッシュボード配下のレイアウト (旧 app/(dashboard)/layout.tsx + template.tsx)。
// 未ログインならサインインへ送る (旧 src/proxy.ts)。実際の認可は各 server
// function 側の getSession() が担う。ログイン後は開こうとしたページに戻す。
export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        to: "/auth/sign-in",
        search: { redirect: location.href },
      });
    }
  },
  head: () => ({
    // 編集用の内部ページ。検索エンジンに載せない
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <Layout
      sidebar={
        <Sidebar>
          <SidebarContentDashboard />
        </Sidebar>
      }
    >
      <Outlet />
    </Layout>
  );
}
