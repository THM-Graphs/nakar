import { useBearStore } from "../../state/useBearStore.ts";
import { Panel } from "../../shared/elements/Panel.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { ViewSettingsEditor } from "./ViewSettingsEditor.tsx";
import {
  actionControllerSetViewSettings,
  LiveCanvasViewSettingsDto,
} from "api-client";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { Stack } from "react-bootstrap";
import { ResetViewSettingsAction } from "../actions/ResetViewSettingsAction.ts";

export function VisualizationPanel() {
  const roomContext = useCanvasContext();
  const hide = useBearStore((s) => s.room.panels.visualization.hide);
  const visualizationData = useBearStore(
    (s) => s.room.scenario.graph.viewSettings,
  );
  const setData = useBearStore((s) => s.room.panels.visualization.setData);
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  return (
    <Panel
      direction={"right"}
      title={"Visualization"}
      onClose={() => {
        hide();
      }}
      toolbar={
        <Stack direction={"horizontal"}>
          <ActionNavbarButton
            action={ResetViewSettingsAction.shared}
            params={{ roomContext: roomContext }}
            hideTitle={true}
          ></ActionNavbarButton>
        </Stack>
      }
    >
      <Stack className={"pb-5"}>
        <ViewSettingsEditor
          viewSettings={visualizationData}
          className={"pb-5"}
          onChange={(newSettings: LiveCanvasViewSettingsDto) => {
            setData(newSettings);

            actionControllerSetViewSettings({
              path: {
                roomId: roomContext.initialRoomData.id,
                canvasId: roomContext.initialCanvasData.id,
              },
              body: newSettings,
            })
              .then((res) => {
                return resultOrThrow(res);
              })
              .catch(pushErrorNotification);
          }}
        ></ViewSettingsEditor>
      </Stack>
    </Panel>
  );
}
