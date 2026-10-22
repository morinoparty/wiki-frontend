import { MinecraftProvider } from "@morinoparty/chlorophyll-react/components";
import { ThemeProvider, type ThemeProviderProps } from "next-themes";
import { MINECRAFT_ASSETS_URL } from "@/lib/minecraft-assets";

// chlorophyll のトークンは Panda が CSS に焼くので、テーマ用のランタイム Provider は要らない。
// ここに置くのは、カラーモードを class に反映する next-themes と、
// Minecraft 系コンポーネント (MinecraftItem / SkinViewer など) のアセットの置き場所を渡す MinecraftProvider。
// 旧実装は ThemeProvider を二重に重ねていたが、内側の設定しか効かないので 1 つに畳んでいる。
export function Provider({ children, ...props }: ThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      <MinecraftProvider assets={MINECRAFT_ASSETS_URL}>
        {children}
      </MinecraftProvider>
    </ThemeProvider>
  );
}
