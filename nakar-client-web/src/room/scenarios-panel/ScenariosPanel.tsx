import { Panel } from "../../shared/elements/Panel.tsx";
import { AppContext } from "../../state/AppContext.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";

export function ScenariosPanel(props: {
  context: AppContext;
  roomContext: CanvasContext;
}) {
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);
  const scenarios = useBearStore((s) => s.room.panels.scenarios.scenarios);

  return (
    <Panel direction={"left"} onClose={hide} title={"Scenarios"}>
      <ScenarioGroupList
        scenarioGroups={scenarios.scenarioGroups}
        context={props.context}
        roomContext={props.roomContext}
      ></ScenarioGroupList>
      <div className={"flex-grow-1"}></div>
    </Panel>
  );
}
