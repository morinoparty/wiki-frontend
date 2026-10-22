import { createFileRoute, Outlet } from "@tanstack/react-router";
import Layout from "@/components/Layout";
import { NotFound } from "@/components/NotFound";
import { Sidebar } from "@/components/Sidebar";
import { SidebarContentNormal } from "@/components/SidebarContent";
import { fetchCategories } from "@/server/content";

// 公開ページ共通のレイアウト (旧 app/(normal)/template.tsx)。
export const Route = createFileRoute("/_normal")({
  loader: async () => ({ categories: await fetchCategories() }),
  // カテゴリはデプロイ時にしか変わらないので、遷移ごとに取り直さない
  staleTime: 5 * 60_000,
  component: NormalLayout,
  notFoundComponent: NotFound,
});

function NormalLayout() {
  const { categories } = Route.useLoaderData();
  return (
    <Layout
      sidebar={
        <Sidebar>
          <SidebarContentNormal categories={categories} />
        </Sidebar>
      }
    >
      <Outlet />
    </Layout>
  );
}
