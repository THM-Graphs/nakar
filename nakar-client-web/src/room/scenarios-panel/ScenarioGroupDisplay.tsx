import { Stack } from "react-bootstrap";
import { AppContext } from "../../state/AppContext.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { ScenarioDisplay } from "./ScenarioDisplay.tsx";
import { ScenarioDto, ScenarioGroupDto } from "../../../src-gen-2";

export function ScenarioGroupDisplay(props: {
  scenarioGroup: ScenarioGroupDto;
  hidden?: boolean;
  context: AppContext;
  roomContext: CanvasContext;
}) {
  return (
    <DynamicList
      data={props.scenarioGroup.scenarios}
      entityNamePlural={"Scenarios"}
      customTitle={props.scenarioGroup.title}
      filter={(exp, s) =>
        (s.title ?? "").toLowerCase().includes(exp.toLowerCase())
      }
      previewLimit={100}
      className={"border-bottom"}
      render={(list) => (
        <>
          <Stack direction={"horizontal"} className={"align-items-stretch"}>
            <Stack>
              <Stack className={"flex-grow-0"}>
                {list.map((scenario: ScenarioDto) => (
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
