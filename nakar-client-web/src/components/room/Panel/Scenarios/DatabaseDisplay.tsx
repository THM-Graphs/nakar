import { Database } from "../../../../../src-gen";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";
import { Stack } from "react-bootstrap";
import { Collapsable } from "../../Collapsable.tsx";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";

export function DatabaseDisplay(props: {
  database: Database;
  context: AppContext;
  roomContext: RoomContext;
}) {
  return (
    <Stack className={"border-bottom flex-grow-0"}>
      <Collapsable
        initialState={true}
        title={
          <>
            <span className={"small fw-bold"}>{props.database.title}</span>
          </>
        }
      >
        <Stack direction={"horizontal"} className={"align-items-stretch"}>
          <div
            className={"bg-primary flex-shrink-0 flex-grow-0"}
            style={{ width: "3px" }}
          ></div>

          <Stack>
            {props.database.browserUrl && (
              <NavbarButton
                size={"sm"}
                icon={"box-arrow-up-right"}
                title={"Neo4j Browser"}
                className={"border-start-0 border-end-0 flex-grow-1"}
                onClick={() => {
                  if (props.database.browserUrl) {
                    window.open(props.database.browserUrl, "_blank");
                  }
                }}
              ></NavbarButton>
            )}
            {props.database.editUrl && (
              <NavbarButton
                size={"sm"}
                icon={"pencil-fill"}
                title={"Edit"}
                className={"border-start-0 border-end-0 flex-grow-1"}
                onClick={() => {
                  if (props.database.editUrl) {
                    window.open(props.database.editUrl, "_blank");
                  }
                }}
              ></NavbarButton>
            )}
            <ScenarioGroupList
              scenarioGroups={props.database.scenarioGroups}
              context={props.context}
              roomContext={props.roomContext}
            ></ScenarioGroupList>
          </Stack>
        </Stack>
      </Collapsable>
    </Stack>
  );
}
