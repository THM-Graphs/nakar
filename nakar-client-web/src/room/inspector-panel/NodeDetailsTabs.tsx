import { Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import clsx from "clsx";
import { useBearStore } from "../../state/useBearStore.ts";

export function NodeDetailsTabs() {
  const tab = useBearStore((s) => s.room.panels.inspector.tab);
  const setTab = useBearStore((s) => s.room.panels.inspector.setTab);
  return (
    <Stack direction={"horizontal"} className={"border-bottom"}>
      <NavbarButton
        title={"Knowledge Card"}
        className={clsx(
          "flex-grow-1 border-end bg-body-secondary",
          tab === "knowledgeCard" && "bg-body-tertiary",
        )}
        onClick={() => {
          setTab("knowledgeCard");
        }}
      ></NavbarButton>
      <NavbarButton
        title={"Inspector"}
        className={clsx(
          "flex-grow-1 bg-body-secondary",
          tab === "inspector" && "bg-body-tertiary",
        )}
        onClick={() => {
          setTab("inspector");
        }}
      ></NavbarButton>
    </Stack>
  );
}
