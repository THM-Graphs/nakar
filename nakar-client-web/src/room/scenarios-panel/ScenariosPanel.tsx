import { Panel } from "../../shared/elements/Panel.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";
import { Stack } from "react-bootstrap";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { ReloadScenariosAction } from "../actions/ReloadScenariosAction.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";

export function ScenariosPanel() {
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);
  const scenarios = useBearStore((s) => s.room.panels.scenarios.scenarios);
  const roomContext = useCanvasContext();

  return (
    <Panel
      direction={"left"}
      onClose={hide}
      title={"Scenarios"}
      toolbar={
        <ActionNavbarButton
          action={ReloadScenariosAction.shared}
          params={{ roomContext: roomContext }}
          hideTitle={true}
        ></ActionNavbarButton>
      }
    >
      <Stack className={"pb-5 overflow-y-scroll"}>
        <ScenarioGroupList
          scenarioGroups={scenarios.scenarioGroups}
        ></ScenarioGroupList>
      </Stack>
    </Panel>
  );
}
