import { useBearStore } from "../../state/useBearStore.ts";
import { Panel } from "../../shared/elements/Panel.tsx";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import {
  CanvasViewSettings,
  postCanvasActionSetViewSettings,
} from "../../../src-gen";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { ViewSettingsEditor } from "./ViewSettingsEditor.tsx";
import { Loading } from "../../shared/elements/Loading.tsx";

export function VisualizationPanel(props: { roomContext: CanvasContext }) {
  const hide = useBearStore((s) => s.room.panels.visualization.hide);
  const visualizationData = useBearStore(
    (s) => s.room.panels.visualization.data,
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
      {visualizationData ? (
        <ViewSettingsEditor
          viewSettings={visualizationData}
          onChange={(newSettings: CanvasViewSettings) => {
            setData(newSettings);

            postCanvasActionSetViewSettings({
              path: {
                id: props.roomContext.initialCanvasData.id,
              },
              body: {
                viewSettings: newSettings,
              },
            })
              .then((res) => {
                return resultOrThrow(res);
              })
              .catch(pushErrorNotification);
          }}
        ></ViewSettingsEditor>
      ) : (
        <span className={"text-muted small fst-italic align-self-center p-5"}>
          Visualization
        </span>
      )}
    </Panel>
  );
}
