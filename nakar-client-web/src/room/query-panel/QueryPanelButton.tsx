import { useBearStore } from "../../state/useBearStore.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";

export function QueryPanelButton() {
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const show = useBearStore((s) => s.room.panels.query.show);
  const hide = useBearStore((s) => s.room.panels.query.hide);

  return (
    <NavbarButton
      icon={"play-circle"}
      selected={leftPanel === "query"}
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
