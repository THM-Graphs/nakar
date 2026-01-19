import { Panel } from "../../shared/elements/Panel.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";

export function ScenariosPanel() {
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);
  const scenarios = useBearStore((s) => s.room.panels.scenarios.scenarios);

  return (
    <Panel direction={"left"} onClose={hide} title={"Scenarios"}>
      <ScenarioGroupList
        scenarioGroups={scenarios.scenarioGroups}
      ></ScenarioGroupList>
      <div className={"flex-grow-1"}></div>
    </Panel>
  );
}
