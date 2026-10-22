import { Drawer, Portal } from "@morinoparty/chlorophyll-react/components";
import { Menu } from "lucide-react";
import { IconButton } from "@/components/IconButton";

/**
 * Drawer の開閉まわりだけを担うクライアント境界。
 *
 * chlorophyll の Drawer は `Object.assign` で組んだ複合コンポーネントなので、
 * Server Component から `Drawer.Content` のようにドット参照すると
 * client reference proxy が「Content という名前の export」を探しにいって
 * undefined になる。境界をこのファイルに閉じ込め、
 * 中身(async Server Component を含む)は children として受け取る。
 */
export const SidebarDrawerShell: React.FC<{
  contentClassName?: string;
  children: React.ReactNode;
}> = ({ contentClassName, children }) => {
  return (
    <Drawer.Root placement="start">
      <Drawer.Trigger asChild>
        <IconButton aria-label="メニュー">
          <Menu />
        </IconButton>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content className={contentClassName}>
            {children}
            <Drawer.CloseTrigger aria-label="メニューを閉じる" />
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};
