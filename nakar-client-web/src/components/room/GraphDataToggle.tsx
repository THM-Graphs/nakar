import { Stack } from "react-bootstrap";
import { NavbarButton } from "../shared/NavbarButton.tsx";
import { useBearStore } from "../../lib/state/useBearStore.ts";

export function GraphDataToggle() {
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  const tableData = useBearStore((s) => s.room.scenario.graph.table.data);
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);

  const graphElementsCount =
    graphElements.edges.length + graphElements.nodes.length;
  return (
    <Stack direction={"horizontal"}>
      <NavbarButton
        icon={"bounding-box-circles"}
        title={"Graph"}
        selected={tabs.selected === "graph"}
        onClick={tabs.selectGraph}
        className={""}
      >
        {graphElementsCount > 0 && (
          <span className={"text-muted"}>{graphElementsCount}</span>
        )}
      </NavbarButton>
      <NavbarButton
        icon={"table"}
        title={"Data"}
        selected={tabs.selected === "data"}
        onClick={tabs.selectData}
        className={"border-end"}
      >
        {tableData.length > 0 && (
          <span className={"text-muted"}>{tableData.length}</span>
        )}
      </NavbarButton>
    </Stack>
  );
}
