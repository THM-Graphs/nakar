import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";

export function InspectorPanelButton() {
  const rightPanels = useBearStore((s) => s.room.panels.right);
  const show = useBearStore((s) => s.room.panels.inspector.show);
  const hide = useBearStore((s) => s.room.panels.inspector.hide);

  return (
    <NavbarButton
      selected={rightPanels === "inspector"}
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
