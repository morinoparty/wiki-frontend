import { ReactNode } from "react";
import { auth, ExtendedSession } from "@/lib/auth";

interface AuthConditionalProps {
  children: ReactNode;
  fallback?: ReactNode; // 認証されていない場合に表示する要素
}

export const AuthConditional = async ({
  children,
  fallback = null,
}: AuthConditionalProps) => {
  const session = (await auth()) as ExtendedSession;
  if (!session) return <>{fallback}</>;
  return <>{children}</>;
};
