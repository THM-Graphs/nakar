import { Modal, Spinner, Stack } from "react-bootstrap";
import { Panel } from "../../shared/elements/Panel.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useEffect, useState } from "react";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { SelectableTableData } from "./SelectableTableData.tsx";
import { actionControllerExpandNode } from "api-client";
import { useCanvasContext } from "../../pages/Canvas.tsx";

export function ExpandNodePreviewModal() {
  const roomContext = useCanvasContext();
  const data = useBearStore((s) => s.room.scenario.expandNodePreview.data);
  const close = useBearStore((s) => s.room.scenario.expandNodePreview.close);
  const clean = useBearStore((s) => s.room.scenario.expandNodePreview.clean);
  const shown = useBearStore((s) => s.room.scenario.expandNodePreview.shown);
  const setSelectedLabel = useBearStore(
    (s) => s.room.scenario.expandNodePreview.setSelectedLabel,
  );
  const setSelectedRelationships = useBearStore(
    (s) => s.room.scenario.expandNodePreview.setSelectedRelationships,
  );
  const [sum, setSum] = useState(0);

  const handleClose = () => {
    close();
  };

  const handleClean = () => {
    clean();
  };

  useEffect(() => {
    if (data) {
      let result: number = 0;
      for (const relationship of data.relationships) {
        if (data.selectedRelationships.has(relationship.identificator)) {
          result += relationship.count;
        }
      }
      for (const label of data.labels) {
        if (data.selectedLabels.has(label.identificator)) {
          result += label.count;
        }
      }
      setSum(result);
    }
  }, [data]);

  return (
    <Modal show={shown} onHide={handleClose} onExited={handleClean}>
      <Panel
        title={"Expand Node"}
        onClose={handleClose}
        direction={"none"}
        hidden={false}
        fullWidth={true}
      >
        <Stack
          style={{
            maxHeight: `${(window.innerHeight - 150).toString()}px`,
          }}
          className={"overflow-y-auto"}
          gap={5}
        >
          <Stack className={"pb-2 pt-2 bg-body-tertiary"} gap={3}>
            <span className={"small text-muted ps-3 pe-3"}>
              Expanding this node will yield to many graph elements. Please
              select all labels and relationships to load.
            </span>
          </Stack>
          {data ? (
            <>
              <SelectableTableData
                title={"Labels"}
                data={data.labels}
                onSelectionChange={setSelectedLabel}
                selections={data.selectedLabels}
              ></SelectableTableData>
              <SelectableTableData
                title={"Relationships"}
                data={data.relationships}
                onSelectionChange={setSelectedRelationships}
                selections={data.selectedRelationships}
              ></SelectableTableData>
            </>
          ) : (
            <Spinner className={"m-5 align-self-center text-muted"}></Spinner>
          )}
          <Stack
            direction={"horizontal"}
            className={
              "border-top justify-content-between sticky-bottom bg-body-tertiary"
            }
          >
            <NavbarButton
              title={"Cancel"}
              icon={"x-lg"}
              onClick={handleClose}
              className={"ps-1 pe-1 justify-content-center border-end"}
            ></NavbarButton>
            <Stack direction={"horizontal"}>
              <NavbarButton
                onClick={async () => {
                  if (data == null) {
                    return;
                  }
                  close();
                  resultOrThrow(
                    await actionControllerExpandNode({
                      path: {
                        roomId: roomContext.initialRoomData.id,
                        canvasId: roomContext.initialCanvasData.id,
                      },
                      body: {
                        nodeIds: [data.nodeId],
                        limit: {
                          labels: [...data.selectedLabels.values()],
                          relationships: [
                            ...data.selectedRelationships.values(),
                          ],
                        },
                      },
                    }),
                  );
                }}
                disabled={sum === 0 || data == null}
                className={"ps-1 pe-1 justify-content-center border-start"}
                icon="zoom-in"
                title="Expand"
              ></NavbarButton>
            </Stack>
          </Stack>
        </Stack>
      </Panel>
    </Modal>
  );
}
