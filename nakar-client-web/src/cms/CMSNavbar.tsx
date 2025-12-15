import { AppNavbar } from "../shared/bars/AppNavbar.tsx";
import { NavbarLogo } from "../shared/bars/NavbarLogo.tsx";
import { InfoDropdown } from "../shared/bars/InfoDropdown.tsx";
import { AppContext } from "../state/AppContext.ts";

export function CMSNavbar(props: { context: AppContext }) {
  return (
    <AppNavbar
      center={<NavbarLogo></NavbarLogo>}
      right={<InfoDropdown context={props.context}></InfoDropdown>}
    ></AppNavbar>
  );
}
