import Layout from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { SidebarContentDashboard } from "@/components/SidebarContent";

export default function Template({
  modal,
  children,
}: {
  modal: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      {modal}
      <Layout
        sidebar={
          <Sidebar>
            <SidebarContentDashboard />
          </Sidebar>
        }
      >
        {children}
      </Layout>
    </>
  );
}
