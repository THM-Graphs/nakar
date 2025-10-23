import { useBearStore } from "../../state/useBearStore.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";

export function SearchPanelButton() {
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const show = useBearStore((s) => s.room.panels.search.show);
  const hide = useBearStore((s) => s.room.panels.search.hide);

  return (
    <NavbarButton
      icon={"search"}
      selected={leftPanel === "search"}
      size={"big"}
      className={"align-self-start flex-grow-0"}
      onToggle={(selected) => {
        if (selected) {
          show();
        } else {
          hide();
        }
      }}
    ></NavbarButton>
  );
}
