import { Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { AppContext } from "../../state/AppContext.ts";
import { useEffect } from "react";
import { Subscription } from "rxjs";
import { WSServerToClientMessage } from "../../../src-gen";
import { match } from "ts-pattern";

export function GraphDataToggle(props: { context: AppContext }) {
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
          <span className={"text-muted small"}>{graphElementsCount}</span>
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
          <span className={"text-muted small"}>{tableData.length}</span>
        )}
      </NavbarButton>
    </Stack>
  );
}
