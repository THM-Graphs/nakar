import { Labels } from "./Labels.tsx";
import { GraphRendererD3 } from "./GraphRendererD3.tsx";
import { Stack } from "react-bootstrap";
import { DataTable } from "../DataTable.tsx";
import { CanvasToolbar } from "./CanvasToolbar.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../pages/Room.tsx";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { useEffect, useState } from "react";
import { D3RendererEvents } from "../../../lib/d3/D3RendererEvents.ts";

export function Canvas(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const tabs = useBearStore((s) => s.room.canvas.tabs);

  const [rendererEvents, setRendererEvents] = useState<D3RendererEvents | null>(
    null,
  );

  useEffect(() => {
    setRendererEvents(new D3RendererEvents());
  }, []);

  return (
    <Stack
      className={"flex-grow-1  flex-shrink-1 align-items-stretch"}
      direction={"vertical"}
      style={{ height: "100%", width: "100px" }}
    >
      <CanvasToolbar
        context={props.context}
        roomContext={props.roomContext}
      ></CanvasToolbar>
      <Stack direction={"horizontal"}>
        {tabs.selected == "graph" ? <Labels></Labels> : <DataTable></DataTable>}
        <div className={"flex-grow-1"}></div>
        <Stack className={"flex-grow-0"}>
          <NavbarButton
            icon={"crosshair"}
            style={{ zIndex: 1 }}
            onClick={() => rendererEvents?.onCenter.next()}
          ></NavbarButton>
          <NavbarButton
            icon={"zoom-in"}
            style={{ zIndex: 1 }}
            onClick={() => rendererEvents?.onZoomIn.next()}
          ></NavbarButton>
          <NavbarButton
            icon={"zoom-out"}
            style={{ zIndex: 1 }}
            onClick={() => rendererEvents?.onZoomOut.next()}
          ></NavbarButton>
        </Stack>
      </Stack>
      {rendererEvents && (
        <GraphRendererD3
          context={props.context}
          roomContext={props.roomContext}
          events={rendererEvents}
        ></GraphRendererD3>
      )}
    </Stack>
  );
}
