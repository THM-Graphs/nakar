import { Modal } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { AuthModalContent } from "./AuthModalContent.tsx";

export function AuthModal() {
  const shown = useBearStore((s) => s.global.auth.loginWindow.shown);
  const hide = useBearStore((s) => s.global.auth.loginWindow.hide);

  return (
    <Modal show={shown} onHide={hide}>
      <AuthModalContent></AuthModalContent>
    </Modal>
  );
}
