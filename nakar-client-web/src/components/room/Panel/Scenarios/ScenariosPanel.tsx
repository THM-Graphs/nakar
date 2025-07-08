import { DatabaseList } from "./DatabaseList.tsx";
import { Panel } from "../Panel.tsx";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";
import { getScenarios } from "../../../../../src-gen";
import { useState } from "react";

export function ScenariosPanel(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const shown = useBearStore((s) => s.room.panels.scenarios.shown);
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);
  const setScenarios = useBearStore(
    (s) => s.room.panels.scenarios.setScenarios,
  );
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  const [reloading, setReloading] = useState<boolean>(false);

  return (
    <Panel
      hidden={!shown}
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
              const scenarios = resultOrThrow(await getScenarios());
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
      <DatabaseList
        context={props.context}
        roomContext={props.roomContext}
      ></DatabaseList>
    </Panel>
  );
}
