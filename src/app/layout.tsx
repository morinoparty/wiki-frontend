import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "@/components/ui/provider";

export const metadata: Metadata = {
  title: {
    template: "%s | もりのパーティ公式Wiki もりぱうぃき!",
    default: "もりのパーティ公式Wiki もりぱうぃき!",
  },
  description:
    "もりのパーティ公式Wiki「もりぱうぃき!」は、もりのパーティに関する情報を集約するためのコミュニティWikiです。Minecraftコミュニティ「もりのパーティ」に参加したことがあれば、すぐに使い始めることができます。",
};

export default function RootLayout({
  modal,
  children,
}: Readonly<{
  modal: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link
          href="https://shogo82148.github.io/genjyuugothic-subsets/GenJyuuGothicL-P-Medium/GenJyuuGothicL-P-Medium.css"
          type="text/css"
          rel="stylesheet"
        />

        <link
          href="https://shogo82148.github.io/genjyuugothic-subsets/GenJyuuGothicL-P-Bold/GenJyuuGothicL-P-Bold.css"
          type="text/css"
          rel="stylesheet"
        />
      </head>
      <body>
        <Provider>
          {modal}
          {children}
        </Provider>
      </body>
    </html>
  );
}
