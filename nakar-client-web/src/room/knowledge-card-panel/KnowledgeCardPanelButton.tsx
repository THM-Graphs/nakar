import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import clsx from "clsx";

export function KnowledgeCardPanelButton(props: { className?: string }) {
  const rightPanels = useBearStore((s) => s.room.panels.right);
  const show = useBearStore((s) => s.room.panels.knowledgeCard.show);
  const hide = useBearStore((s) => s.room.panels.knowledgeCard.hide);

  return (
    <NavbarButton
      selected={rightPanels === "knowledgeCard"}
      size={"big"}
      onToggle={(selected) => {
        if (selected) {
          show();
        } else {
          hide();
        }
      }}
      icon={"lightbulb"}
      className={clsx(props.className)}
    ></NavbarButton>
  );
}
