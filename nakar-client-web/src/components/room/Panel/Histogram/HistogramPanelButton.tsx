import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";

export function HistogramPanelButton() {
  const shown = useBearStore((s) => s.room.panels.histogram.shown);
  const show = useBearStore((s) => s.room.panels.histogram.show);
  const hide = useBearStore((s) => s.room.panels.histogram.hide);

  return (
    <NavbarButton
      title={"Histogram"}
      selected={shown}
      onToggle={(selected) => {
        if (selected) {
          show();
        } else {
          hide();
        }
      }}
      icon={"bar-chart-fill"}
    ></NavbarButton>
  );
}
