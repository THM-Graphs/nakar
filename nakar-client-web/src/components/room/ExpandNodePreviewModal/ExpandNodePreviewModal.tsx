import { Modal, Stack } from "react-bootstrap";
import { Panel } from "../Panel/Panel.tsx";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { postRoomActionExpandNode } from "../../../../src-gen";
import { useEffect, useState } from "react";
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";
import { RoomContext } from "../../../pages/Room.tsx";
import { SelectableTableData } from "./SelectableTableData.tsx";

export function ExpandNodePreviewModal(props: { roomContext: RoomContext }) {
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
      {data && (
        <>
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
            >
              <Stack className={"pb-2 pt-2 bg-body-tertiary"} gap={3}>
                <span className={"small text-muted ps-3 pe-3"}>
                  Expanding this node will yield to many graph elements. Please
                  select all labels and relationships to load.
                </span>
              </Stack>
              <SelectableTableData
                title={"Label"}
                data={data.labels}
                onSelectionChange={setSelectedLabel}
                selections={data.selectedLabels}
              ></SelectableTableData>
              <SelectableTableData
                title={"Relationship"}
                data={data.relationships}
                onSelectionChange={setSelectedRelationships}
                selections={data.selectedRelationships}
              ></SelectableTableData>
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
                      close();
                      await resultOrThrow(
                        await postRoomActionExpandNode({
                          path: {
                            id: props.roomContext.initialRoomData.id,
                          },
                          body: {
                            nodeId: data.nodeId,
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
                    disabled={sum === 0}
                    className={"ps-1 pe-1 justify-content-center border-start"}
                  >
                    <i className={"bi bi-zoom-in btn p-0"}></i>
                    <span>Expand</span>
                  </NavbarButton>
                </Stack>
              </Stack>
            </Stack>
          </Panel>
        </>
      )}
    </Modal>
  );
}
