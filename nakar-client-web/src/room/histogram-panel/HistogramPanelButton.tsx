import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";

export function HistogramPanelButton() {
  const rightPanels = useBearStore((s) => s.room.panels.right);
  const show = useBearStore((s) => s.room.panels.histogram.show);
  const hide = useBearStore((s) => s.room.panels.histogram.hide);

  return (
    <NavbarButton
      selected={rightPanels === "histogram"}
      size={"big"}
      onToggle={(selected) => {
        if (selected) {
          show();
        } else {
          hide();
        }
      }}
      icon={"bar-chart"}
    ></NavbarButton>
  );
}
