import { Stack } from "react-bootstrap";
import { NavbarButton } from "../shared/NavbarButton.tsx";
import { useBearStore } from "../../lib/state/useBearStore.ts";

export function GraphDataToggle() {
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  return (
    <Stack direction={"horizontal"}>
      <NavbarButton
        icon={"bounding-box-circles"}
        title={"Graph"}
        selected={tabs.selected === "graph"}
        onClick={tabs.selectGraph}
        className={""}
      ></NavbarButton>
      <NavbarButton
        icon={"table"}
        title={"Data"}
        selected={tabs.selected === "data"}
        onClick={tabs.selectData}
        className={"border-end"}
      ></NavbarButton>
    </Stack>
  );
}
