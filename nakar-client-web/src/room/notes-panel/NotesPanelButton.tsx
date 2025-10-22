import { useBearStore } from "../../state/useBearStore.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";

export function NotesPanelButton() {
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const show = useBearStore((s) => s.room.panels.notes.show);
  const hide = useBearStore((s) => s.room.panels.notes.hide);

  return (
    <NavbarButton
      icon={"sticky"}
      selected={leftPanel === "notes"}
      size={"big"}
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
