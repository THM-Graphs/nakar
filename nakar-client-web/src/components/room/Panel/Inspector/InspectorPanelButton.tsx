import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";

export function InspectorPanelButton() {
  const shown = useBearStore((s) => s.room.panels.inspector.shown);
  const show = useBearStore((s) => s.room.panels.inspector.show);
  const hide = useBearStore((s) => s.room.panels.inspector.hide);

  return (
    <NavbarButton
      title={"Inspector"}
      selected={shown}
      onToggle={(selected) => {
        if (selected) {
          show();
        } else {
          hide();
        }
      }}
      icon={"info-circle-fill"}
    ></NavbarButton>
  );
}
