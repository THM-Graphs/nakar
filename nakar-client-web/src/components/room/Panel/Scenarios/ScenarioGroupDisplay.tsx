import { Scenario, ScenarioGroup } from "../../../../../src-gen";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { Stack } from "react-bootstrap";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import { DynamicList } from "../../DynamicList.tsx";
import { ScenarioDisplay } from "./ScenarioDisplay.tsx";

export function ScenarioGroupDisplay(props: {
  scenarioGroup: ScenarioGroup;
  hidden?: boolean;
  context: AppContext;
  roomContext: RoomContext;
}) {
  return (
    <DynamicList
      data={props.scenarioGroup.scenarios}
      entityNamePlural={"Scenarios"}
      customTitle={props.scenarioGroup.title ?? undefined}
      filter={(exp, s) =>
        (s.title ?? "").toLowerCase().includes(exp.toLowerCase())
      }
      className={"border-bottom"}
      render={(list) => (
        <>
          <Stack direction={"horizontal"} className={"align-items-stretch"}>
            <Stack>
              {props.scenarioGroup.editUrl && (
                <NavbarButton
                  size={"sm"}
                  icon={"pencil-fill"}
                  title={"Edit"}
                  className={
                    "border-bottom-0 border-top-0 border-start-0 border-end-0"
                  }
                  onClick={() => {
                    if (props.scenarioGroup.editUrl) {
                      window.open(props.scenarioGroup.editUrl, "_blank");
                    }
                  }}
                ></NavbarButton>
              )}
              <Stack className={"flex-grow-0"}>
                {list.map((scenario: Scenario) => (
                  <ScenarioDisplay
                    key={scenario.id}
                    scenario={scenario}
                    context={props.context}
                    roomContext={props.roomContext}
                  ></ScenarioDisplay>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </>
      )}
    ></DynamicList>
  );
}
