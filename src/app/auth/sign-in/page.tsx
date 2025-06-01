import { LoginModal } from "@/components/LoginModal";
import { ModalDialogWrapper } from "@/components/ModalDialogWrapper";

export default async function Home() {
  return (
    <ModalDialogWrapper isPage>
      <LoginModal />
    </ModalDialogWrapper>
  );
}
