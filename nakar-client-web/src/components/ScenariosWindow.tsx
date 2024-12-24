import { createRef, ReactNode, useEffect, useState } from "react";
import {
  Button,
  Spinner,
  Image,
  Alert,
  Accordion,
  Table,
  Stack,
} from "react-bootstrap";
import { actions, useBearStore } from "../lib/State.ts";
import { match } from "ts-pattern";
import { Window } from "./Window.tsx";
import {
  GetScenariosDto,
  GetScenariosDtoDatabase,
  GetScenariosDtoDatabaseScenario,
} from "../shared/dto.ts";
import interact from "interactjs";
import type { Interactable } from "@interactjs/core/Interactable";
import {
  bindLogicalPositionIntoParent,
  logicalToNativePosition,
} from "../lib/Draggable.ts";

export function ScenariosWindow() {
  const scenarios = useBearStore((state) => state.scenariosWindow.scenarios);

  const [position, setPosition] = useState({ x: 20, y: 20 });

  const windowRef = createRef<HTMLElement>();
  const [windowHandle, setWindowHandle] = useState<HTMLDivElement | null>(null);
  const [windowTitleHandle, setWindowTitleHandle] =
    useState<HTMLDivElement | null>(null);
  const [parentContainerHandle, setParentContainerHandle] =
    useState<HTMLDivElement | null>(null);
  const [slider, setSlider] = useState<Interactable | null>(null);

  useEffect(() => {
    if (windowRef.current == null) {
      return;
    }
    setWindowHandle(windowRef.current as HTMLDivElement);
    setWindowTitleHandle(windowRef.current.children.item(0) as HTMLDivElement);
    setParentContainerHandle(windowRef.current.parentElement as HTMLDivElement);
  }, [windowRef]);

  useEffect(actions.scenariosWindow.reloadScenarios, []);

  useEffect(() => {
    if (windowTitleHandle == null) {
      return;
    }
    setSlider(interact(windowTitleHandle));
  }, [windowTitleHandle]);

  useEffect(() => {
    if (
      slider == null ||
      parentContainerHandle == null ||
      windowHandle == null
    ) {
      return;
    }
    slider.draggable({
      inertia: true,
      listeners: {
        move(event: { dx: number; dy: number }) {
          setPosition((oldPosition) => {
            return bindLogicalPositionIntoParent(
              {
                x: oldPosition.x + event.dx,
                y: oldPosition.y + event.dy,
              },
              parentContainerHandle,
              windowHandle,
              false,
            );
          });
        },
      },
    });
    setPosition((oldPosition) => {
      return bindLogicalPositionIntoParent(
        oldPosition,
        parentContainerHandle,
        windowHandle,
        false,
      );
    });
  }, [slider]);

  useEffect(() => {
    if (windowHandle == null || parentContainerHandle == null) {
      return;
    }
    const nativPosition = logicalToNativePosition(
      position,
      parentContainerHandle,
    );
    windowHandle.style.top = `${nativPosition.y.toString()}px`;
    windowHandle.style.left = `${nativPosition.x.toString()}px`;
  }, [position]);

  return (
    <>
      <Window
        title={"Scenarios"}
        className={"position-absolute"}
        ref={windowRef}
        onClose={actions.scenariosWindow.toggleWindow}
        icon={"easel-fill"}
        style={{
          width: "500px",
          maxHeight: "600px",
          zIndex: 600,
        }}
      >
        {match(scenarios)
          .with({ type: "loading" }, (): ReactNode => <Loading></Loading>)
          .with(
            { type: "error" },
            (error): ReactNode => <Error message={error.message}></Error>,
          )
          .with(
            { type: "data" },
            (data): ReactNode => <Data data={data.data}></Data>,
          )
          .exhaustive()}
      </Window>
    </>
  );
}

function Loading() {
  return (
    <Stack className={"justify-content-center p-4"}>
      <Spinner className={"align-self-center"}></Spinner>
    </Stack>
  );
}

function Error(props: { message: string }) {
  return (
    <Stack className={"p-3"}>
      <Alert
        ref={null}
        variant={"danger"}
        className={"d-flex align-items-center"}
      >
        <span className={"me-auto"}>{props.message}</span>
        <Button onClick={actions.scenariosWindow.reloadScenarios} variant={""}>
          <i className={"bi bi-arrow-clockwise"}></i>
        </Button>
      </Alert>
    </Stack>
  );
}

function Data(props: { data: GetScenariosDto }) {
  return (
    <Accordion>
      {props.data.databases.map(
        (database): ReactNode => (
          <ListSection key={database.id} database={database}></ListSection>
        ),
      )}
    </Accordion>
  );
}

function ListSection(props: { database: GetScenariosDtoDatabase }) {
  const database = props.database;

  return (
    <Accordion.Item
      key={database.id}
      eventKey={database.id}
      className={"border-0 border-bottom rounded-0"}
    >
      <Accordion.Header>
        {database.title} ({database.url})
      </Accordion.Header>
      <Accordion.Body className={"p-0"}>
        <Table striped className={"align-middle"}>
          <tbody>
            {database.scenarios.map(
              (scenario): ReactNode => (
                <ScenarioEntry
                  key={scenario.id}
                  scenario={scenario}
                ></ScenarioEntry>
              ),
            )}
          </tbody>
        </Table>
      </Accordion.Body>
    </Accordion.Item>
  );
}

function ScenarioEntry(props: { scenario: GetScenariosDtoDatabaseScenario }) {
  const scenario = props.scenario;
  return (
    <tr>
      <td>
        {scenario.coverUrl ? (
          <Image
            style={{ width: "30px", height: "30px" }}
            src={scenario.coverUrl}
            roundedCircle
          ></Image>
        ) : (
          <div
            style={{
              width: "30px",
              height: "30px",
              backgroundColor: "gray",
            }}
            className={
              "d-flex justify-content-center align-items-center flex-shrink-0 rounded-circle"
            }
          >
            <i className={"bi bi-easel-fill"}></i>
          </div>
        )}
      </td>
      <td>
        <span className={"me-auto"}>{scenario.title}</span>
      </td>
      <td>
        <Button
          onClick={() => {
            actions.canvas.loadInitialGraph(scenario.id);
          }}
        >
          Run
        </Button>
      </td>
    </tr>
  );
}
