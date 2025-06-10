import { useNavigate } from "react-router";
import { NavbarButton } from "./NavbarButton.tsx";

export function BackButton(props: { href: string; title?: string | null }) {
  const navigate = useNavigate();

  return (
    <NavbarButton
      title={props.title ?? undefined}
      icon={"chevron-left"}
      onClick={() => {
        void navigate(props.href);
      }}
      className={"border-start-0"}
    ></NavbarButton>
  );
}
