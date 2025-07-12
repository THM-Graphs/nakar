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
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";
import { postRoomActionRelayout } from "../../../../src-gen";

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
      className={"flex-grow-1 flex-shrink-1 align-items-stretch"}
      direction={"vertical"}
      style={{ height: "100%", width: "100px" }}
    >
      <CanvasToolbar
        context={props.context}
        roomContext={props.roomContext}
      ></CanvasToolbar>
      {tabs.selected == "graph" ? (
        <Stack direction={"horizontal"} className={"justify-content-between"}>
          <Labels></Labels>
          <Stack
            className={
              "flex-grow-0 flex-shrink-1 justify-content-end flex-wrap"
            }
            direction={"horizontal"}
            gap={0}
          >
            <NavbarButton
              icon={"tropical-storm"}
              title={"Layout"}
              style={{ zIndex: 1 }}
              onClick={async () => {
                resultOrThrow(
                  await postRoomActionRelayout({
                    path: { id: props.roomContext.initialRoomData.id },
                  }),
                );
              }}
              className={"bg-body-hover"}
            ></NavbarButton>
            <NavbarButton
              icon={"crosshair"}
              title={"Center"}
              style={{ zIndex: 1 }}
              onClick={() => rendererEvents?.onCenter.next()}
              className={"bg-body-hover"}
            ></NavbarButton>
            <NavbarButton
              icon={"aspect-ratio"}
              title={"Overview"}
              style={{ zIndex: 1 }}
              onClick={() => rendererEvents?.onZoomOutOverview.next()}
              className={"bg-body-hover"}
            ></NavbarButton>
            <NavbarButton
              icon={"zoom-in"}
              title={"Zoom in"}
              style={{ zIndex: 1 }}
              onClick={() => rendererEvents?.onZoomIn.next()}
              className={"bg-body-hover"}
            ></NavbarButton>
            <NavbarButton
              icon={"zoom-out"}
              title={"Zoom out"}
              style={{ zIndex: 1 }}
              onClick={() => rendererEvents?.onZoomOut.next()}
              className={"bg-body-hover"}
            ></NavbarButton>
          </Stack>
        </Stack>
      ) : (
        <DataTable></DataTable>
      )}
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
