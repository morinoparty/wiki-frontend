import { Menu, Portal } from "@morinoparty/chlorophyll-react/components";
import { useRouter } from "@tanstack/react-router";
import { signOutFromMineAuth } from "@/server/auth";

/** ユーザーボックスのドロップダウンメニュー。 */
export const UserBoxMenu: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();
  return (
    <Menu.Root>
      <Menu.Trigger asChild>{children}</Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              value="logout"
              onClick={async () => {
                await signOutFromMineAuth();
                // root の beforeLoad でセッションを読み直してからトップへ
                await router.invalidate();
                await router.navigate({ to: "/" });
              }}
            >
              ログアウト
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
