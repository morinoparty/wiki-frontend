import {
  Avatar,
  IconButton,
} from "@morinoparty/chlorophyll-react/components";
import { useSessionUser } from "@/hooks/useSessionUser";
import { UserBoxMenu } from "@/components/UserBoxMenu";
import { Ellipsis } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";

export const UserBox: React.FC = () => {
  const user = useSessionUser();
  if (!user) {
    return;
  }

  return (
    <div
      className={css({
        display: "grid",
        gridTemplateColumns: "32px 1fr auto",
        gap: "12px",
        alignItems: "center",
      })}
    >
      {/* 隣に名前を表示しているため、画像は装飾扱いにして読み上げの二重化を避ける。
          画像が無い・読み込めないときは Avatar が名前の頭文字を表示する */}
      <Avatar.Root size="sm" shape="rounded">
        <Avatar.Image src={user.image || undefined} alt="" />
        <Avatar.Fallback name={user.name || "Unknown User"} aria-hidden />
      </Avatar.Root>
      <p
        className={css({
          textStyle: "body",
          color: "colorPalette.fg",
        })}
      >
        <Link to="/dashboard">
          {user.name || "Unknown User"}
        </Link>
      </p>
      <UserBoxMenu>
        <IconButton aria-label="More options" size="sm" shape="circle">
          <Ellipsis />
        </IconButton>
      </UserBoxMenu>
    </div>
  );
};
