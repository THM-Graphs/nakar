import { useBearStore } from "../../state/useBearStore.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import clsx from "clsx";

export function VisualizationPanelButton(props: { className?: string }) {
  const rightPanel = useBearStore((s) => s.room.panels.right);
  const show = useBearStore((s) => s.room.panels.visualization.show);
  const hide = useBearStore((s) => s.room.panels.visualization.hide);

  return (
    <NavbarButton
      icon={"eye"}
      selected={rightPanel === "visualization"}
      size={"big"}
      className={clsx(props.className)}
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
