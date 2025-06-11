import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";

export function ScenariosPanelButton() {
  const shown = useBearStore((s) => s.room.panels.scenarios.shown);
  const show = useBearStore((s) => s.room.panels.scenarios.show);
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);

  return (
    <NavbarButton
      icon={"easel-fill"}
      title={"Scenarios"}
      selected={shown}
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
