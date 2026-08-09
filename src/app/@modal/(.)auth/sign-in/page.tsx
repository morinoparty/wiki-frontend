import { LoginModal } from "@/components/LoginModal";
import { ModalDialogRoot } from "@/components/ModalDialogRoot";

export default async function Home() {
  return (
    <ModalDialogRoot>
      <LoginModal />
    </ModalDialogRoot>
  );
}
