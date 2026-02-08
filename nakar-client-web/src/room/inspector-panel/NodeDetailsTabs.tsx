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
          "flex-grow-1 border-end",
          tab === "knowledgeCard" && "bg-body-secondary",
        )}
        onClick={() => {
          setTab("knowledgeCard");
        }}
      ></NavbarButton>
      <NavbarButton
        title={"Inspector"}
        className={clsx(
          "flex-grow-1",
          tab === "inspector" && "bg-body-secondary",
        )}
        onClick={() => {
          setTab("inspector");
        }}
      ></NavbarButton>
    </Stack>
  );
}
