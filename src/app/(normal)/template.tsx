import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { SidebarContentNormal } from "@/components/SidebarContent";

export default function Template({
  children,
}: {
  modal: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Layout
      sidebar={
        <Sidebar>
          <SidebarContentNormal />
        </Sidebar>
      }
    >
      {children}
    </Layout>
  );
}
