import { AppNavbar } from "../bars/AppNavbar.tsx";
import { NavbarLogo } from "../bars/NavbarLogo.tsx";
import { InfoDropdown } from "../bars/InfoDropdown.tsx";
import { NavbarButton } from "../elements/NavbarButton.tsx";
import { useNavigate } from "react-router";

export function CMSNavbar(props: { backUrl: string | null }) {
  const navigate = useNavigate();
  return (
    <AppNavbar
      left={
        <>
          {props.backUrl != null && (
            <NavbarButton
              icon={"chevron-left"}
              onClick={async () => {
                await navigate(props.backUrl ?? "..");
              }}
            ></NavbarButton>
          )}
        </>
      }
      center={<NavbarLogo></NavbarLogo>}
      right={<InfoDropdown></InfoDropdown>}
    ></AppNavbar>
  );
}
