import { actions, useBearStore } from "../lib/State.ts";
import { match } from "ts-pattern";
import { ReactNode, useEffect } from "react";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Image,
  Spinner,
  Stack,
} from "react-bootstrap";
import {
  GetScenariosDto,
  GetScenariosDtoDatabase,
  GetScenariosDtoDatabaseScenario,
} from "../shared/dto.ts";

export function ScenariosList() {
  const scenarios = useBearStore((state) => state.scenariosWindow.scenarios);

  useEffect(actions.scenariosWindow.reloadScenarios, []);

  return (
    <Stack className={"shadow border-end"}>
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
    </Stack>
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
        <span className={"me-2"}>{database.title}</span>
        <Badge bg="secondary">{database.url}</Badge>
      </Accordion.Header>
      <Accordion.Body className={"p-0"}>
        {database.scenarios.map(
          (scenario): ReactNode => (
            <ScenarioEntry
              key={scenario.id}
              scenario={scenario}
            ></ScenarioEntry>
          ),
        )}
      </Accordion.Body>
    </Accordion.Item>
  );
}

function ScenarioEntry(props: { scenario: GetScenariosDtoDatabaseScenario }) {
  const scenario = props.scenario;
  return (
    <Card className={"m-2"}>
      <Card.Body>
        <Card.Title
          className={"d-flex gap-2 align-items-center justify-content-start"}
        >
          {scenario.coverUrl ? (
            <Image
              style={{ width: "50px", height: "50px" }}
              src={scenario.coverUrl}
              roundedCircle
            ></Image>
          ) : (
            <div
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "gray",
              }}
              className={
                "d-flex justify-content-center align-items-center flex-shrink-0 rounded-circle"
              }
            >
              <i className={"bi bi-easel-fill"}></i>
            </div>
          )}
          <span>{scenario.title}</span>
        </Card.Title>
        <Card.Text className={"font-monospace"}>{scenario.query}</Card.Text>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(scenario.query).catch(console.error);
          }}
          className={"btn-secondary me-2"}
        >
          Copy Query
        </Button>
        <Button
          onClick={() => {
            actions.canvas.loadInitialGraph(scenario.id);
          }}
        >
          Run
        </Button>
      </Card.Body>
    </Card>
  );
}
