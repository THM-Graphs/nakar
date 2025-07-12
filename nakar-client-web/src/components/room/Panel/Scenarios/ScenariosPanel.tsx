import { Panel } from "../Panel.tsx";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";
import { getScenarios } from "../../../../../src-gen";
import { useState } from "react";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";
import { Stack } from "react-bootstrap";

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
      <Stack>
        <ScenarioGroupList
          scenarioGroups={scenarios.scenarioGroups}
          context={props.context}
          roomContext={props.roomContext}
        ></ScenarioGroupList>
      </Stack>
    </Panel>
  );
}
