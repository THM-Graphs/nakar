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
    <Stack
      direction={"vertical"}
      className={clsx(
        "bg-body-tertiary border border-end-0 z-1 rounded-start",
        props.className,
      )}
    >
      <NavbarButton
        size={"big"}
        icon={"bounding-box-circles"}
        selected={tabs.selected === "graph"}
        onClick={tabs.selectGraph}
        className={"position-relative"}
      >
        <Stack
          className={
            "text-muted position-absolute bottom-0 start-0 end-0 align-items-center"
          }
          style={{ fontSize: "8pt" }}
        >
          <span>{graphElementsCount}</span>
        </Stack>
      </NavbarButton>
      <NavbarButton
        size={"big"}
        icon={"table"}
        selected={tabs.selected === "data"}
        onClick={tabs.selectData}
        className={"position-relative"}
      >
        <Stack
          className={
            "text-muted position-absolute bottom-0 start-0 end-0 align-items-center"
          }
          style={{ fontSize: "8pt" }}
        >
          <span>{tableData.length}</span>
        </Stack>
      </NavbarButton>
    </Stack>
  );
}
