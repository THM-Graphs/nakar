import { postRoomActionLoadScenario, ScenarioGroup } from "../../../src-gen";
import { RoomContext } from "../../pages/Room.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Dropdown, Stack } from "react-bootstrap";
import { resultOrThrow } from "../../data/resultOrThrow.ts";
import { ScenarioTitleAndBadges } from "../scenarios-panel/ScenarioTitleAndBadges.tsx";

export function PropertyMenuScenarioGroupEntry(props: {
  scenarioGroup: ScenarioGroup;
  roomContext: RoomContext;
  value: unknown;
}) {
  const scenarioGroup = props.scenarioGroup;

  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  const uiLocked = useBearStore((s) => s.room.ui.locked);

  return (
    <>
      {scenarioGroup.scenarios.map((scenario) => {
        return (
          <Dropdown.Item
            disabled={uiLocked}
            key={scenario.id}
            onClick={() => {
              // showRunScenarioModal(
              //   scenariosAndGroup[1],
              //   typeof props.value === "string"
              //     ? props.value
              //     : JSON.stringify(props.value),
              // );
              (async () => {
                try {
                  await resultOrThrow(
                    await postRoomActionLoadScenario({
                      path: {
                        id: props.roomContext.initialRoomData.id,
                      },
                      body: {
                        scenarioId: scenario.id,
                        arguments: [
                          {
                            identifier: scenario.parameters[0].identifier,
                            value: JSON.stringify(props.value),
                          },
                        ],
                      },
                    }),
                  );
                } catch (error) {
                  pushErrorNotification(error);
                }
              })().catch(pushErrorNotification);
            }}
          >
            <Stack
              gap={0}
              direction={"vertical"}
              className={"justify-content-between"}
            >
              <span className={"small text-muted"}>{scenarioGroup.title}</span>
              <ScenarioTitleAndBadges
                scenario={scenario}
              ></ScenarioTitleAndBadges>
            </Stack>
          </Dropdown.Item>
        );
      })}
    </>
  );
}
