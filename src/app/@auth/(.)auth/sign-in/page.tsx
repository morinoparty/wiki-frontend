import { LoginModal } from "@/components/LoginModal";
import { LoginModalWrapper } from "@/components/LoginModalWrapper";

export default async function Home() {
  return (
    <LoginModalWrapper>
      <LoginModal />
    </LoginModalWrapper>
  );
}
