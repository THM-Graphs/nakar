import { useBearStore } from "../../state/useBearStore.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import clsx from "clsx";

export function SearchPanelButton(props: { className?: string }) {
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const show = useBearStore((s) => s.room.panels.search.show);
  const hide = useBearStore((s) => s.room.panels.search.hide);

  return (
    <NavbarButton
      icon={"search"}
      size={"big"}
      selected={leftPanel === "search"}
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
