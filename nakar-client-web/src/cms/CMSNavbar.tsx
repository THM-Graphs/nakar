import { AppNavbar } from "../shared/bars/AppNavbar.tsx";
import { NavbarLogo } from "../shared/bars/NavbarLogo.tsx";
import { InfoDropdown } from "../shared/bars/InfoDropdown.tsx";
import { AppContext } from "../state/AppContext.ts";
import { NavbarButton } from "../shared/elements/NavbarButton.tsx";
import { useNavigate } from "react-router";

export function CMSNavbar(props: {
  context: AppContext;
  backUrl: string | null;
}) {
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
      right={<InfoDropdown context={props.context}></InfoDropdown>}
    ></AppNavbar>
  );
}
