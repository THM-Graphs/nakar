import { createRef, useEffect, useState } from "react";
import interact from "interactjs";
import {
  Button,
  Card,
  ListGroup,
  Spinner,
  Stack,
  Image,
} from "react-bootstrap";
import { useBearStore } from "./Zustand.ts";
import { match } from "ts-pattern";
import { getScenarios } from "./Backend.ts";
import clsx from "clsx";
import { min } from "rxjs";

export function ScenariosWindow() {
  console.log("Render!");
  const store = useBearStore((state) => state.scenariosWindow);
  const [minimized, setMinimized] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 20, y: 20 });
  const dragCard = createRef<HTMLDivElement>();
  const dragCardTitle = createRef<HTMLDivElement>();

  const fetchScenarios = async (): Promise<void> => {
    const data = await getScenarios();
    store.setScenarios(data);
  };

  const handleDragging = (
    windowHeader: HTMLElement,
    window: HTMLElement,
    windowParent: HTMLElement,
  ) => {
    const applyPosition = () => {
      window.style.top = `${windowPosition.y.toString()}px`;
      window.style.left = `${windowPosition.x.toString()}px`;
    };
    const slider = interact(windowHeader);
    slider.draggable({
      inertia: true,
      listeners: {
        move(event: { dx: number; dy: number }) {
          setWindowPosition({
            x: Math.min(
              Math.max(windowPosition.x + event.dx, 0),
              windowParent.getBoundingClientRect().width -
                window.getBoundingClientRect().width,
            ),
            y: Math.min(
              Math.max(windowPosition.y + event.dy, 0),
              windowParent.getBoundingClientRect().height -
                window.getBoundingClientRect().height,
            ),
          });
          applyPosition();
        },
      },
    });
    applyPosition();
  };

  useEffect(() => {
    fetchScenarios().catch(console.error);
  }, []);

  useEffect(() => {
    if (
      !dragCardTitle.current ||
      !dragCard.current ||
      !dragCard.current.parentElement
    ) {
      return;
    }
    handleDragging(
      dragCardTitle.current,
      dragCard.current,
      dragCard.current.parentElement,
    );
  }, [dragCardTitle, dragCard]);

  return (
    <>
      <Card
        id={"dragCard"}
        className={"position-absolute"}
        ref={dragCard}
        style={{
          width: "400px",
          height: minimized ? null : "500px",
          boxSizing: "border-box",
        }}
      >
        <Card.Header ref={dragCardTitle}>
          <Stack direction={"horizontal"}>
            <Card.Title className={"me-auto"}>Scenarios</Card.Title>
            <Button
              variant={""}
              onClick={() => {
                setMinimized(!minimized);
              }}
            >
              <i
                className={clsx(
                  "bi",
                  minimized ? "bi-chevron-right" : "bi-chevron-down",
                )}
              ></i>
            </Button>
          </Stack>
        </Card.Header>
        {!minimized && (
          <Card.Body className={"d-flex flex-column"}>
            {match(store.scenarios)
              .with({ type: "loading" }, () => (
                <Spinner className={"align-self-center"}></Spinner>
              ))
              .with({ type: "data" }, (scenarios) =>
                scenarios.data.databases.map((database) => (
                  <Stack key={database.id}>
                    <h6>
                      {database.title} ({database.host}:{database.port})
                    </h6>
                    <ListGroup>
                      {database.scenarios.map((scenario) => (
                        <ListGroup.Item key={scenario.id}>
                          <Stack
                            direction={"horizontal"}
                            className={"align-items-center"}
                          >
                            <Image
                              style={{ width: "30px", height: "30px" }}
                              className={"me-1"}
                              src={scenario.coverUrl}
                              roundedCircle
                            ></Image>
                            <span className={"me-auto"}>{scenario.title}</span>
                            <Button>Run</Button>
                          </Stack>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Stack>
                )),
              )
              .exhaustive()}
          </Card.Body>
        )}
      </Card>
    </>
  );
}
