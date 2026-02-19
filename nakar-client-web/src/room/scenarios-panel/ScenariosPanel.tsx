import { Panel } from "../../shared/elements/Panel.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";
import { Stack } from "react-bootstrap";

export function ScenariosPanel() {
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);
  const scenarios = useBearStore((s) => s.room.panels.scenarios.scenarios);

  return (
    <Panel direction={"left"} onClose={hide} title={"Scenarios"}>
      <Stack className={"pb-5 overflow-y-scroll"}>
        <ScenarioGroupList
          scenarioGroups={scenarios.scenarioGroups}
        ></ScenarioGroupList>
      </Stack>
    </Panel>
  );
}
