import { postCanvasActionLoadScenario, ScenarioGroup } from "../../../src-gen";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Dropdown, Stack } from "react-bootstrap";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { ScenarioTitleAndBadges } from "../scenarios-panel/ScenarioTitleAndBadges.tsx";

export function PropertyMenuScenarioGroupEntry(props: {
  scenarioGroup: ScenarioGroup;
  roomContext: CanvasContext;
  value: unknown;
}) {
  const scenarioGroup = props.scenarioGroup;

  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  return (
    <>
      {scenarioGroup.scenarios.map((scenario) => {
        return (
          <Dropdown.Item
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
                    await postCanvasActionLoadScenario({
                      path: {
                        id: props.roomContext.initialCanvasData.id,
                      },
                      body: {
                        scenarioId: scenario.id,
                        arguments: [
                          {
                            identifier: scenario.parameters[0].identifier,
                            value: JSON.stringify(props.value),
                          },
                        ],
                        additive: false, // TODO
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
