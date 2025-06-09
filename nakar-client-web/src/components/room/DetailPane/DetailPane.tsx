import { Button, CloseButton, Spinner, Stack } from "react-bootstrap";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { GraphProperty } from "../../../../src-gen";
import { PropertyDisplay } from "./PropertyDisplay.tsx";
import { ReactNode } from "react";

export function DetailPane(props: {
  entityTitle: string;
  title: string;
  actions: DetailPaneAction[];
  properties: GraphProperty[];
  otherProperties: GraphProperty[];
  onClose: () => void;
  loading: boolean;
  children?: ReactNode;
}) {
  return (
    <Stack
      className={"border-start flex-shrink-0 flex-grow-0 bg-body-tertiary"}
      style={{ width: "400px", zIndex: 1 }}
    >
      <Stack
        direction={"horizontal"}
        className={"border-bottom justify-content-between flex-0"}
      >
        {props.entityTitle.length > 0 && (
          <span className={"ms-2 text-muted"}>{props.entityTitle}</span>
        )}
        <CloseButton className={"m-1"} onClick={props.onClose}></CloseButton>
      </Stack>
      <Stack className={"overflow-auto flex-shrink-1"}>
        {props.title.length > 0 && (
          <Stack direction={"horizontal"}>
            <span
              style={{ overflowWrap: "anywhere", userSelect: "text" }}
              className={"p-2 h5"}
            >
              {props.title}
            </span>
          </Stack>
        )}
        {props.actions.length > 0 && (
          <Stack direction={"horizontal"} gap={2} className={"p-2 pt-0"}>
            {props.actions.map((action: DetailPaneAction) => (
              <Button
                key={action.title}
                size={"sm"}
                onClick={action.action}
                disabled={props.loading}
                variant={action.variant}
              >
                {props.loading && (
                  <Spinner size={"sm"} className={"me-2"}></Spinner>
                )}
                <i className={`bi bi-${action.icon} me-1`}></i>
                {action.title}
              </Button>
            ))}
          </Stack>
        )}
        <PropertyDisplay
          title={"Property"}
          properties={props.properties}
        ></PropertyDisplay>
        <PropertyDisplay
          title={"Other Property"}
          properties={props.otherProperties}
        ></PropertyDisplay>
        {props.children}
      </Stack>
    </Stack>
  );
}
