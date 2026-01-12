import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import clsx from "clsx";

export function ScenariosPanelButton(props: { className?: string }) {
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const show = useBearStore((s) => s.room.panels.scenarios.show);
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);

  return (
    <NavbarButton
      size={"big"}
      icon={"easel"}
      selected={leftPanel === "scenarios"}
      className={clsx("align-self-start flex-grow-0", props.className)}
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
