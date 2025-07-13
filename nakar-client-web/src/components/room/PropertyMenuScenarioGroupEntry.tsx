import { postRoomActionLoadScenario, ScenarioGroup } from "../../../src-gen";
import { RoomContext } from "../../pages/Room.tsx";
import { useBearStore } from "../../lib/state/useBearStore.ts";
import { Dropdown, Stack } from "react-bootstrap";
import { resultOrThrow } from "../../lib/data/resultOrThrow.ts";

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
                            value:
                              typeof props.value === "string"
                                ? props.value
                                : JSON.stringify(props.value),
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
              gap={2}
              direction={"horizontal"}
              className={"justify-content-between"}
            >
              <Stack direction={"horizontal"} gap={2}>
                <i
                  className={"bi bi-play-circle-fill btn btn-link btn-sm p-0"}
                ></i>
                <span className={"small"}>{scenario.title}</span>
              </Stack>
              <span className={"small text-muted"}>{scenarioGroup.title}</span>
            </Stack>
          </Dropdown.Item>
        );
      })}
    </>
  );
}
