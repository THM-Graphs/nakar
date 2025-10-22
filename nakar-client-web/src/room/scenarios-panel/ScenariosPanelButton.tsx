import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";

export function ScenariosPanelButton() {
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const show = useBearStore((s) => s.room.panels.scenarios.show);
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);

  return (
    <NavbarButton
      size={"big"}
      icon={"easel"}
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
