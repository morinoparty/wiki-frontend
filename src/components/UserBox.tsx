import { useSessionUser } from "@/hooks/useSessionUser";
import { UserBoxMenu } from "@/components/UserBoxMenu";
import { IconButton } from "@/components/IconButton";
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
        gridTemplateColumns: "36px 1fr auto",
        gap: "12px",
        alignItems: "center",
      })}
    >
      <img
        src={user.image || ""}
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
