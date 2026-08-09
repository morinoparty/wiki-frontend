"use client";

import { Menu, Portal } from "@chakra-ui/react";
import { startTransition } from "react";
import { signOutFromMineAuth } from "@/actions/auth-actions";

/**
 * ユーザーボックスのドロップダウンメニュー。
 *
 * Server Action をそのまま `onClick` に渡すと React がクリックイベントを
 * 引数としてシリアライズしようとして失敗するため、クライアント側で
 * 引数なしに呼び直す。Server Action 内の `redirect()` を
 * ルーター遷移として処理させるため startTransition で包む。
 */
export const UserBoxMenu: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>{children}</Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              value="logout"
              color={"leaf.600"}
              onClick={() => {
                startTransition(() => {
                  void signOutFromMineAuth();
                });
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
