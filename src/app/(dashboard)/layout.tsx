import type { Metadata } from "next";

// ダッシュボード配下は編集用の内部ページ。検索エンジンに載せない。
export const metadata: Metadata = {
  title: "ダッシュボード",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
