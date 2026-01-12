import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import clsx from "clsx";

export function InspectorPanelButton(props: { className?: string }) {
  const rightPanels = useBearStore((s) => s.room.panels.right);
  const show = useBearStore((s) => s.room.panels.inspector.show);
  const hide = useBearStore((s) => s.room.panels.inspector.hide);

  return (
    <NavbarButton
      size={"big"}
      selected={rightPanels === "inspector"}
      onToggle={(selected) => {
        if (selected) {
          show();
        } else {
          hide();
        }
      }}
      icon={"info-circle"}
      className={clsx(props.className)}
    ></NavbarButton>
  );
}
