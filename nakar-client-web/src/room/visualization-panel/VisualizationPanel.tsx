import { useBearStore } from "../../state/useBearStore.ts";
import { Panel } from "../../shared/elements/Panel.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { ViewSettingsEditor } from "./ViewSettingsEditor.tsx";
import {
  actionControllerSetViewSettings,
  LiveCanvasViewSettingsDto,
} from "../../../src-gen";
import { useCanvasContext } from "../../pages/CanvasPage.tsx";

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
    >
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
    </Panel>
  );
}
