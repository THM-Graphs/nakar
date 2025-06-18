import { ScenarioGroup } from "../../../../../src-gen";
import { ScenariosList } from "./ScenariosList.tsx";
import { Collapsable } from "../../Collapsable.tsx";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { Stack } from "react-bootstrap";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";

export function ScenarioGroupDisplay(props: {
  scenarioGroup: ScenarioGroup;
  hidden?: boolean;
  context: AppContext;
  roomContext: RoomContext;
}) {
  return (
    <Collapsable
      initialState={true}
      title={
        <>
          <span className={"small text-muted"}>
            {props.scenarioGroup.title}
          </span>
        </>
      }
    >
      <Stack direction={"horizontal"} className={"align-items-stretch"}>
        <div
          className={"bg-success flex-shrink-0 flex-grow-0 ms-1"}
          style={{ width: "3px" }}
        ></div>
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
          <ScenariosList
            roomContext={props.roomContext}
            context={props.context}
            scenarios={props.scenarioGroup.scenarios}
          ></ScenariosList>
        </Stack>
      </Stack>
    </Collapsable>
  );
}
