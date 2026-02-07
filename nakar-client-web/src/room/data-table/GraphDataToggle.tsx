import { Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import clsx from "clsx";

export function GraphDataToggle(props: { className?: string }) {
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  const tableData = useBearStore((s) => s.room.scenario.graph.table.data);
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);

  const graphElementsCount =
    graphElements.edges.length + graphElements.nodes.length;

  return (
    <Stack direction={"horizontal"} className={clsx("", props.className)}>
      <NavbarButton
        icon={"bounding-box-circles"}
        selected={tabs.selected === "graph"}
        onClick={tabs.selectGraph}
        className={"position-relative"}
        title={
          <span>
            Graph{" "}
            <span className={"text-muted"}>
              {graphElementsCount.toString()}
            </span>
          </span>
        }
      ></NavbarButton>
      <NavbarButton
        icon={"table"}
        selected={tabs.selected === "data"}
        onClick={tabs.selectData}
        className={"position-relative"}
        title={
          <span>
            Table{" "}
            <span className={"text-muted"}>{tableData.length.toString()}</span>
          </span>
        }
      ></NavbarButton>
    </Stack>
  );
}
