import { MinecraftProvider } from "@morinoparty/chlorophyll-react/components";
import { ThemeProvider, type ThemeProviderProps } from "next-themes";
import { MINECRAFT_ASSETS_URL } from "@/lib/minecraft-assets";
import { playerAvatarUrl, playerSkinUrl } from "@/lib/mc-api";

// プレイヤーの顔とスキンは mc-heads.net (chlorophyll の既定) ではなく mc-api から読む。
// 毎レンダーで新しいオブジェクトを渡さないよう、モジュールの定数にしておく
const minecraftConfig = {
  avatarUrl: playerAvatarUrl,
  skinUrl: playerSkinUrl,
};

// chlorophyll のトークンは Panda が CSS に焼くので、テーマ用のランタイム Provider は要らない。
// ここに置くのは、カラーモードを class に反映する next-themes と、
// Minecraft 系コンポーネント (MinecraftItem / SkinViewer / PlayerAvatar など) のアセットと
// プレイヤー画像の取得先を渡す MinecraftProvider。
// 旧実装は ThemeProvider を二重に重ねていたが、内側の設定しか効かないので 1 つに畳んでいる。
export function Provider({ children, ...props }: ThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      <MinecraftProvider assets={MINECRAFT_ASSETS_URL} config={minecraftConfig}>
        {children}
      </MinecraftProvider>
    </ThemeProvider>
  );
}
