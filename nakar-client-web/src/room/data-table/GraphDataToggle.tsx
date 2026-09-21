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
      className={clsx("z-1 bg-body-tertiary pt-1", props.className)}
    >
      <div
        style={{ width: "10px" }}
        className={clsx("flex-grow-0 flex-shrink-1 border-bottom h-100")}
      ></div>
      <NavbarButton
        icon={"bounding-box-circles"}
        selected={tabs.selected === "graph"}
        onClick={tabs.selectGraph}
        className={clsx(
          "position-relative pe-auto border-start border-top border-end",
          tabs.selected === "data" && "border-bottom",
        )}
        selectedClassName={"bg-body"}
        title={
          <span>
            Graph{" "}
            <span className={"text-muted"}>
              {graphElementsCount.toString()}
            </span>
          </span>
        }
      ></NavbarButton>
      <div
        style={{ width: "5px" }}
        className={clsx("flex-grow-0 flex-shrink-1 border-bottom h-100")}
      ></div>
      <NavbarButton
        icon={"table"}
        selected={tabs.selected === "data"}
        onClick={tabs.selectData}
        selectedClassName={"bg-body"}
        className={clsx(
          "position-relative pe-auto border-top border-start border-end ",
          tabs.selected === "graph" && "border-bottom",
        )}
        title={
          <span>
            Table{" "}
            <span className={"text-muted"}>{tableData.length.toString()}</span>
          </span>
        }
      ></NavbarButton>
      <div className={"flex-grow-1 flex-shrink-1 border-bottom h-100"}></div>
    </Stack>
  );
}
