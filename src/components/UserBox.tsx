import { auth, ExtendedSession, signOut } from "@/lib/auth";
import { IconButton, Menu, Portal } from "@chakra-ui/react";
import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { css } from "styled-system/css";

export const UserBox: React.FC = async () => {
  const session = (await auth()) as ExtendedSession;

  if (!session) {
    return;
  }

  return (
    <div
      className={css({
        display: "grid",
        gridTemplateColumns: "36px 1fr auto",
        gap: "12px",
        alignItems: "center",
      })}
    >
      <img
        src={session?.user?.image || ""}
        alt="User Avatar"
        width={36}
        height={36}
        className={css({
          borderRadius: "8px",
          objectFit: "cover",
          objectPosition: "center",
        })}
      />
      <p
        className={css({
          textStyle: "body",
          color: "leaf.600",
        })}
      >
        <Link href={"/dashboard/"}>
          {session?.user?.name || "Unknown User"}
        </Link>
      </p>
      <UserBoxMenu>
        <IconButton
          variant={"ghost"}
          aria-label="More options"
          size="sm"
          borderRadius={"50%"}
          color={"leaf.600"}
        >
          <Ellipsis />
        </IconButton>
      </UserBoxMenu>
    </div>
  );
};

const UserBoxMenu: React.FC<{
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
              onClick={async () => {
                "use server";
                await signOut();
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
