import { Panel } from "../../shared/elements/Panel.tsx";
import { AppContext } from "../../state/AppContext.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useState } from "react";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";
import { getRoomScenarios } from "../../../src-gen";

export function ScenariosPanel(props: {
  context: AppContext;
  roomContext: CanvasContext;
}) {
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);
  const setScenarios = useBearStore(
    (s) => s.room.panels.scenarios.setScenarios,
  );
  const scenarios = useBearStore((s) => s.room.panels.scenarios.scenarios);
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  const [reloading, setReloading] = useState<boolean>(false);

  return (
    <Panel
      direction={"left"}
      onClose={hide}
      title={"Scenarios"}
      toolbar={
        <NavbarButton
          icon={"arrow-clockwise"}
          disabled={reloading}
          onClick={async (): Promise<void> => {
            try {
              setReloading(true);
              const scenarios = resultOrThrow(
                await getRoomScenarios({
                  path: { id: props.roomContext.initialCanvasData.roomId },
                }),
              );
              setScenarios(scenarios);
            } catch (error: unknown) {
              pushErrorNotification(error);
            } finally {
              setReloading(false);
            }
          }}
          className={""}
        ></NavbarButton>
      }
    >
      <ScenarioGroupList
        scenarioGroups={scenarios.scenarioGroups}
        context={props.context}
        roomContext={props.roomContext}
      ></ScenarioGroupList>
      <div className={"flex-grow-1"}></div>
    </Panel>
  );
}
