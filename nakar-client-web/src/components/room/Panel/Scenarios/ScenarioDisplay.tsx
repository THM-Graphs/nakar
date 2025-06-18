import { postRoomActionLoadScenario, Scenario } from "../../../../../src-gen";
import { ScenarioCard } from "./ScenarioCard.tsx";
import { Button, Stack } from "react-bootstrap";
import { Collapsable } from "../../Collapsable.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { useCallback } from "react";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";

export function ScenarioDisplay(props: {
  scenario: Scenario;
  hidden?: boolean;
  context: AppContext;
  roomContext: RoomContext;
}) {
  const uiLocked = useBearStore((s) => s.room.ui.locked);

  const runScenario = useCallback(() => {
    (async () => {
      try {
        await postRoomActionLoadScenario({
          path: { id: props.roomContext.initialRoomData.id },
          body: { scenarioId: props.scenario.id },
        });
      } catch (error) {
        // TODO: Add error message
      }
    })().catch(console.error);
  }, [props.scenario]);

  return (
    <Collapsable
      inset={0}
      title={
        <Stack direction={"horizontal"} className={"align-items-baseline"}>
          <Button
            variant={"link"}
            disabled={uiLocked}
            size={"sm"}
            onClick={(event) => {
              event.stopPropagation();
              runScenario();
            }}
            className={"p-0 me-1"}
          >
            <i className={"bi bi-play-circle-fill"}></i>
          </Button>
          <span className={"pe-1 small"}>{props.scenario.title}</span>
        </Stack>
      }
    >
      <ScenarioCard
        onScenarioSelected={runScenario}
        scenario={props.scenario}
      ></ScenarioCard>
    </Collapsable>
  );
}
