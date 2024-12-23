import { ForwardedRef, forwardRef, useState } from "react";
import { Button, Card, CardProps, Stack } from "react-bootstrap";
import clsx from "clsx";

export const Window = forwardRef(
  (
    props: CardProps & {
      title: string;
      onClose: () => void;
      icon: string;
    },
    ref: ForwardedRef<HTMLElement>,
  ) => {
    const [minimized, setMinimized] = useState(false);

    return (
      <Card
        {...props}
        ref={ref}
        style={{
          boxSizing: "border-box",
          ...props.style,
          height: minimized ? undefined : props.style?.height,
        }}
      >
        <Card.Header>
          <Stack direction={"horizontal"} className={"align-items-baseline"}>
            <Card.Title className={"me-auto"}><i className={`bi bi-${props.icon} me-1`}></i> {props.title}</Card.Title>
            <Button
              variant={""}
              className={"me-2"}
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
            <Button
              variant={""}
              onClick={props.onClose}
            >
              <i
                className={clsx(
                  "bi bi-x-lg",
                )}
              ></i>
            </Button>
          </Stack>
        </Card.Header>
        {!minimized && (
          <Card.Body className={"d-flex flex-column overflow-y-scroll p-0"}>
            {props.children}
          </Card.Body>
        )}
      </Card>
    );
  },
);
