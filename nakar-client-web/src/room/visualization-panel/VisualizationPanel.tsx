import { Form, Stack } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { Panel } from "../../shared/elements/Panel.tsx";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { setCanvasData } from "../../../src-gen";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { NumberInput } from "../../shared/elements/NumberInput.tsx";

export function VisualizationPanel(props: { roomContext: CanvasContext }) {
  const visualization = useBearStore((s) => s.room.panels.visualization);
  const setCompressRelationshipsWidthFactor = useBearStore(
    (s) => s.room.panels.visualization.setCompressRelationshipsWidthFactor,
  );
  const setGrowNodesBasedOnDegree = useBearStore(
    (s) => s.room.panels.visualization.setGrowNodesBasedOnDegree,
  );
  const setGrowNodesBasedOnDegreeFactor = useBearStore(
    (s) => s.room.panels.visualization.setGrowNodesBasedOnDegreeFactor,
  );
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  return (
    <Panel
      direction={"right"}
      title={"Visualization"}
      onClose={() => {
        visualization.hide();
      }}
    >
      <Stack className={"mb-5 flex-grow-0 flex-shrink-1 mb-auto pb-5"} gap={5}>
        {visualization.data && (
          <Collapsable
            title={<span className={"small"}>General</span>}
            initialState={false}
            className={"border-bottom"}
          >
            <Stack className={"pt-2 pb-2 border-top"} gap={2}>
              <Stack className={"ps-2 pe-2 pb-2 border-bottom"}>
                <Form.Check
                  id={"growNodesBasedOnDegree"}
                  label={
                    <span className={"small"}>Grow Nodes Based On Degree</span>
                  }
                  checked={visualization.data.growNodesBasedOnDegree}
                  onChange={(e) => {
                    setGrowNodesBasedOnDegree(e.target.checked);

                    setCanvasData({
                      path: {
                        id: props.roomContext.initialCanvasData.id,
                      },
                      body: {
                        compressRelationshipsWidthFactor: null,
                        growNodesBasedOnDegree: e.target.checked,
                        growNodesBasedOnDegreeFactor: null,
                      },
                    })
                      .then((res) => resultOrThrow(res))
                      .catch(pushErrorNotification);
                  }}
                ></Form.Check>
                {visualization.data.growNodesBasedOnDegree && (
                  <NumberInput
                    value={visualization.data.growNodesBasedOnDegreeFactor}
                    onChange={(newValue: number) => {
                      setGrowNodesBasedOnDegreeFactor(newValue);

                      setCanvasData({
                        path: {
                          id: props.roomContext.initialCanvasData.id,
                        },
                        body: {
                          compressRelationshipsWidthFactor: null,
                          growNodesBasedOnDegree: null,
                          growNodesBasedOnDegreeFactor: newValue,
                        },
                      })
                        .then((res) => resultOrThrow(res))
                        .catch(pushErrorNotification);
                    }}
                  ></NumberInput>
                )}
                <Form.Text className={"small text-muted"}>
                  The higher the degree of a node, the larger it is displayed.
                </Form.Text>
              </Stack>
              <Stack className={"ps-2 pe-2"}>
                <Form.Label className={"small"}>
                  Relationship Cluster Size
                </Form.Label>
                <NumberInput
                  value={visualization.data.compressRelationshipsWidthFactor}
                  onChange={(newValue: number) => {
                    setCompressRelationshipsWidthFactor(newValue);

                    setCanvasData({
                      path: {
                        id: props.roomContext.initialCanvasData.id,
                      },
                      body: {
                        compressRelationshipsWidthFactor: newValue,
                        growNodesBasedOnDegree: null,
                        growNodesBasedOnDegreeFactor: null,
                      },
                    })
                      .then((res) => resultOrThrow(res))
                      .catch(pushErrorNotification);
                  }}
                ></NumberInput>
                <Form.Text className={"small text-muted"}>
                  The lines of a relationship that is a cluster become thicker.
                </Form.Text>
              </Stack>
            </Stack>
          </Collapsable>
        )}
      </Stack>
    </Panel>
  );
}
