import type { ReactNode } from "react";
import { useSessionUser } from "@/hooks/useSessionUser";

interface AuthConditionalProps {
  children: ReactNode;
  fallback?: ReactNode; // 認証されていない場合に表示する要素
}

export const AuthConditional = ({
  children,
  fallback = null,
}: AuthConditionalProps) => {
  const user = useSessionUser();
  if (!user) return <>{fallback}</>;
  return <>{children}</>;
};
