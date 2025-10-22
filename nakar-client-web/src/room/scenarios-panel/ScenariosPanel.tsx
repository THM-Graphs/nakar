import { Panel } from "../../shared/elements/Panel.tsx";
import { AppContext } from "../../state/AppContext.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { RoomContext } from "../../pages/Room.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { resultOrThrow } from "../../data/resultOrThrow.ts";
import { getScenarios } from "../../../src-gen";
import { useState } from "react";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";

export function ScenariosPanel(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const leftPanel = useBearStore((s) => s.room.panels.left);
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
      hidden={leftPanel !== "scenarios"}
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
                await getScenarios({
                  path: { id: props.roomContext.initialRoomData.id },
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
