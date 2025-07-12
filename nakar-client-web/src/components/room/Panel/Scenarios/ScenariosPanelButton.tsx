import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";

export function ScenariosPanelButton() {
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const show = useBearStore((s) => s.room.panels.scenarios.show);
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);

  return (
    <NavbarButton
      icon={"easel-fill"}
      selected={leftPanel === "scenarios"}
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
