import { ReactNode } from "react";
import { getSession } from "@/lib/auth";

interface AuthConditionalProps {
  children: ReactNode;
  fallback?: ReactNode; // 認証されていない場合に表示する要素
}

export const AuthConditional = async ({
  children,
  fallback = null,
}: AuthConditionalProps) => {
  const session = await getSession();
  if (!session) return <>{fallback}</>;
  return <>{children}</>;
};
