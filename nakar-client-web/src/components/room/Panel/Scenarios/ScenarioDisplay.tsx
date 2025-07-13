import { postRoomActionLoadScenario, Scenario } from "../../../../../src-gen";
import { ScenarioCard } from "./ScenarioCard.tsx";
import { Button, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { Collapsable } from "../../Collapsable.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { useCallback } from "react";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";
import clsx from "clsx";

export function ScenarioDisplay(props: {
  scenario: Scenario;
  hidden?: boolean;
  context: AppContext;
  roomContext: RoomContext;
}) {
  const uiLocked = useBearStore((s) => s.room.ui.locked);
  const showRunScenarioModal = useBearStore(
    (s) => s.room.scenario.runScenarioModal.open,
  );
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const runScenario = useCallback(() => {
    if (props.scenario.parameters.length > 0) {
      showRunScenarioModal(props.scenario, null);
    } else {
      (async () => {
        try {
          await resultOrThrow(
            await postRoomActionLoadScenario({
              path: { id: props.roomContext.initialRoomData.id },
              body: {
                scenarioId: props.scenario.id,
                arguments: [],
              },
            }),
          );
        } catch (error) {
          pushErrorNotification(error);
        }
      })().catch(pushErrorNotification);
    }
  }, [props.scenario]);

  return (
    <Collapsable
      inset={0}
      title={
        <Stack
          direction={"horizontal"}
          className={"align-items-baseline"}
          gap={1}
        >
          <Button
            variant={"link"}
            disabled={uiLocked}
            size={"sm"}
            onClick={(event) => {
              event.stopPropagation();
              runScenario();
            }}
            className={"p-0"}
          >
            <i className={clsx("bi bi-play-circle-fill")}></i>
          </Button>
          {props.scenario.parameters.length > 0 && (
            <OverlayTrigger
              overlay={<Tooltip>This scenario requires arguments.</Tooltip>}
            >
              <i className={"bi bi-code-square small text-mutedd"}></i>
            </OverlayTrigger>
          )}
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
