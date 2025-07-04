import { ForwardedRef, forwardRef, MouseEvent, ReactNode } from "react";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { Dropdown, Stack } from "react-bootstrap";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import {
  Database,
  postRoomActionLoadScenario,
  Scenario,
  ScenarioGroup,
} from "../../../../../src-gen";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";

function findDatabase(
  scenario: Scenario,
  databases: Database[],
): Database | null {
  return (
    databases.find((database: Database): boolean => {
      for (const group of database.scenarioGroups) {
        for (const s of group.scenarios) {
          if (s.id === scenario.id) {
            return true;
          }
        }
      }
      return false;
    }) ?? null
  );
}

function findParameterizedScenariosa(
  database: Database,
): [ScenarioGroup, Scenario][] {
  const result: [ScenarioGroup, Scenario][] = [];
  for (const group of database.scenarioGroups) {
    for (const scenario of group.scenarios) {
      if (scenario.parameters.length > 0) {
        result.push([group, scenario]);
      }
    }
  }
  return result;
}

export function PropertyMenu(props: {
  value: unknown;
  scenario: Scenario;
  roomContext: RoomContext;
}) {
  // const showRunScenarioModal = useBearStore(
  //   (s) => s.room.scenario.runScenarioModal.open,
  // );
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const databases = useBearStore((s) => s.room.panels.scenarios.scenarios);
  const ownDatabase = findDatabase(props.scenario, databases.databases);
  const scenariosAndGroups = ownDatabase
    ? findParameterizedScenariosa(ownDatabase)
    : [];

  const CustomToggle = forwardRef(
    (
      {
        onClick,
      }: {
        onClick: (event: MouseEvent) => void;
        children: ReactNode;
      },
      ref: ForwardedRef<HTMLDivElement>,
    ) => (
      <NavbarButton
        icon={"three-dots-vertical"}
        ref={ref}
        onClick={(event) => {
          event.preventDefault();
          onClick(event);
        }}
        className={"pt-1 pb-1"}
      ></NavbarButton>
    ),
  );

  return (
    <>
      <Dropdown className={"align-items-stretch d-flex"}>
        <Dropdown.Toggle as={CustomToggle}></Dropdown.Toggle>
        <Dropdown.Menu className={"rounded-0"}>
          <Dropdown.Header className={"small"}>Run Scenario</Dropdown.Header>
          {scenariosAndGroups.map((scenariosAndGroup) => {
            return (
              <Dropdown.Item
                key={scenariosAndGroup[1].id}
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
                          path: { id: props.roomContext.initialRoomData.id },
                          body: {
                            scenarioId: scenariosAndGroup[1].id,
                            arguments: [
                              {
                                identifier:
                                  scenariosAndGroup[1].parameters[0].identifier,
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
                  })().catch(console.error);
                }}
              >
                <Stack gap={2} direction={"horizontal"}>
                  <i
                    className={"bi bi-play-circle-fill btn btn-link btn-sm p-0"}
                  ></i>
                  <span className={"small"}>{scenariosAndGroup[1].title}</span>
                </Stack>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
}
