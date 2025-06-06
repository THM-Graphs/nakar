import {
  Button,
  CloseButton,
  Spinner,
  Stack,
  Tab,
  Tabs,
} from "react-bootstrap";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { GraphProperty } from "../../../../src-gen";
import { PropertyDisplay } from "./PropertyDisplay.tsx";

export function DetailPane(props: {
  entityTitle: string;
  title: string;
  actions: DetailPaneAction[];
  properties: GraphProperty[];
  otherProperties: GraphProperty[];
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <Stack
      className={"border-start flex-shrink-0 flex-grow-0 bg-body"}
      style={{ width: "400px", zIndex: 1 }}
    >
      <Stack
        direction={"horizontal"}
        className={"border-bottom justify-content-between flex-0"}
      >
        <span className={"ms-2 text-muted"}>{props.entityTitle}</span>
        <CloseButton className={"m-1"} onClick={props.onClose}></CloseButton>
      </Stack>
      <Stack className={"overflow-auto flex-shrink-1"}>
        <Stack className={"p-2 flex-grow-0"}>
          <h5 style={{ overflowWrap: "anywhere" }}>{props.title}</h5>
          {props.actions.length > 0 && (
            <Stack direction={"horizontal"} gap={1} className={"mt-2"}>
              {props.actions.map((action: DetailPaneAction) => (
                <Button
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
        </Stack>
        <PropertyDisplay
          title={"Property"}
          properties={props.properties}
        ></PropertyDisplay>
        <PropertyDisplay
          title={"Other Property"}
          properties={props.otherProperties}
        ></PropertyDisplay>
      </Stack>
    </Stack>
  );
}
