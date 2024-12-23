import { createRef, ReactNode, useEffect } from "react";
import {
  Button,
  Spinner,
  Image,
  Alert,
  Accordion,
  Table,
} from "react-bootstrap";
import { useBearStore } from "./Zustand.ts";
import { match } from "ts-pattern";
import { reloadScenarios } from "./Actions.ts";
import { registerDrag } from "./Draggable.ts";
import { Window } from "./Window.tsx";
import {
  GetScenariosDto,
  GetScenariosDtoDatabase,
  GetScenariosDtoDatabaseScenario,
} from "./shared/dto.ts";

export function ScenariosWindow() {
  const store = useBearStore((state) => state.scenariosWindow);

  const dragCard = createRef<HTMLElement>();

  useEffect(reloadScenarios, []);

  useEffect(() => {
    registerDrag(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      dragCard.current!.children.item(0)! as HTMLElement,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      dragCard.current!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      dragCard.current!.parentElement!,
    );
  }, []);

  return (
    <>
      <Window
        title={"Scenarios"}
        className={"position-absolute"}
        ref={dragCard}
        style={{
          width: "500px",
          height: "600px",
        }}
      >
        {match(store.scenarios)
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
  return <Spinner className={"align-self-center"}></Spinner>;
}

function Error(props: { message: string }) {
  return (
    <Alert
      ref={null}
      variant={"danger"}
      className={"d-flex align-items-center"}
    >
      <span className={"me-auto"}>{props.message}</span>
      <Button onClick={reloadScenarios} variant={""}>
        <i className={"bi bi-arrow-clockwise"}></i>
      </Button>
    </Alert>
  );
}

function Data(props: { data: GetScenariosDto }) {
  return (
    <Accordion>
      {props.data.databases.map(
        (database): ReactNode => (
          <ListSection database={database}></ListSection>
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
        {database.title} ({database.host}:{database.port})
      </Accordion.Header>
      <Accordion.Body className={"p-0"}>
        <Table striped className={"align-middle"}>
          <tbody>
            {database.scenarios.map(
              (scenario): ReactNode => (
                <ScenarioEntry scenario={scenario}></ScenarioEntry>
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
        <Button>Run</Button>
      </td>
    </tr>
  );
}
