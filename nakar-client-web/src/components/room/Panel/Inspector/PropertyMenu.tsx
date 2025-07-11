import { ForwardedRef, forwardRef, MouseEvent, ReactNode } from "react";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { Dropdown, Spinner, Stack } from "react-bootstrap";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import {
  postRoomActionLoadScenario,
  ScenarioGroup,
} from "../../../../../src-gen";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";
import { Loadable } from "../../../../lib/data/Loadable.ts";
import { match } from "ts-pattern";

export function PropertyMenu(props: {
  value: unknown;
  scenarioGroupsWithParameterizedScenarios: Loadable<ScenarioGroup[]>;
  roomContext: RoomContext;
  onReload: () => void | Promise<void>;
  className?: string;
}) {
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
      ></NavbarButton>
    ),
  );

  if (
    props.scenarioGroupsWithParameterizedScenarios.type === "data" &&
    props.scenarioGroupsWithParameterizedScenarios.data.length === 0
  ) {
    return null;
  }

  return (
    <>
      <Dropdown className={props.className}>
        <Dropdown.Toggle as={CustomToggle}></Dropdown.Toggle>
        <Dropdown.Menu className={"rounded-0"}>
          {match(props.scenarioGroupsWithParameterizedScenarios)
            .with(
              { type: "loading" },
              (): ReactNode => (
                <Dropdown.Header>
                  <Spinner size={"sm"}></Spinner>
                </Dropdown.Header>
              ),
            )
            .with(
              { type: "error" },
              (error): ReactNode => (
                <PropertyMenuError
                  message={error.message}
                  onReload={props.onReload}
                ></PropertyMenuError>
              ),
            )
            .with(
              { type: "data" },
              (data): ReactNode =>
                data.data.map((scenarioGroup) => (
                  <PropertyMenuScenarioGroupEntry
                    scenarioGroup={scenarioGroup}
                    roomContext={props.roomContext}
                    value={props.value}
                    key={scenarioGroup.id}
                  ></PropertyMenuScenarioGroupEntry>
                )),
            )
            .exhaustive()}
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
}

function PropertyMenuError(props: {
  message: string;
  onReload: () => void | Promise<void>;
}) {
  return (
    <>
      <Dropdown.Header className={"text-wrap"}>
        <span>{props.message}</span>
        <NavbarButton
          title={"Retry"}
          icon={"arrow-clockwise"}
          onClick={props.onReload}
        ></NavbarButton>
      </Dropdown.Header>
    </>
  );
}

function PropertyMenuScenarioGroupEntry(props: {
  scenarioGroup: ScenarioGroup;
  roomContext: RoomContext;
  value: unknown;
}) {
  const scenarioGroup = props.scenarioGroup;

  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  return (
    <>
      <Dropdown.Header key={scenarioGroup.id}>
        {scenarioGroup.title}
      </Dropdown.Header>
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
              })().catch(console.error);
            }}
          >
            <Stack gap={2} direction={"horizontal"}>
              <i
                className={"bi bi-play-circle-fill btn btn-link btn-sm p-0"}
              ></i>
              <span className={"small"}>{scenario.title}</span>
            </Stack>
          </Dropdown.Item>
        );
      })}
    </>
  );
}
