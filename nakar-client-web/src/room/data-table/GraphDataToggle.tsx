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
      direction={"horizontal"}
      className={clsx(
        "z-1 p-1 bg-frosted-glass rounded border ms-1 me-1 overflow-hidden pe-auto flex-grow-0 flex-shrink-0",
        props.className,
      )}
      gap={1}
    >
      <Stack
        className={clsx(
          "rounded flex-grow-0 flex-shrink-0 overflow-hidden",
          tabs.selected === "graph" && "bg-body-secondary",
        )}
      >
        <NavbarButton
          icon={"bounding-box-circles"}
          onClick={tabs.selectGraph}
          title={
            <span>
              Graph{" "}
              <span className={"text-muted"}>
                {graphElementsCount.toString()}
              </span>
            </span>
          }
        ></NavbarButton>
      </Stack>
      <Stack
        className={clsx(
          "rounded flex-grow-0 flex-shrink-0 overflow-hidden",
          tabs.selected === "data" && "bg-body-secondary",
        )}
      >
        <NavbarButton
          icon={"table"}
          onClick={tabs.selectData}
          title={
            <span>
              Table{" "}
              <span className={"text-muted"}>
                {tableData.length.toString()}
              </span>
            </span>
          }
        ></NavbarButton>
      </Stack>
    </Stack>
  );
}
