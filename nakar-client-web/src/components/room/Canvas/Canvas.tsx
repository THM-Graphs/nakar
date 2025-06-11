import { Labels } from "./Labels.tsx";
import { GraphRendererD3 } from "./GraphRendererD3.tsx";
import { Stack } from "react-bootstrap";
import { DataTable } from "../DataTable.tsx";
import { CanvasToolbar } from "./CanvasToolbar.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";

export function Canvas(props: { context: AppContext }) {
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  return (
    <Stack
      className={"flex-grow-1  flex-shrink-1 align-items-stretch"}
      direction={"vertical"}
      style={{ height: "100%", width: "100px" }}
    >
      <CanvasToolbar context={props.context}></CanvasToolbar>
      {tabs.selected == "graph" ? <Labels></Labels> : <DataTable></DataTable>}
      <GraphRendererD3 context={props.context}></GraphRendererD3>
    </Stack>
  );
}
