import { Spinner, Stack } from "react-bootstrap";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { GraphProperty } from "../../../../src-gen";
import { PropertyDisplay } from "./PropertyDisplay.tsx";
import { NavbarButton } from "../../shared/NavbarButton.tsx";

export function DetailPane(props: {
  title: string;
  entityTitle: string;
  actions: DetailPaneAction[];
  properties: GraphProperty[];
  otherProperties: GraphProperty[];
  loading: boolean;
}) {
  return (
    <Stack className={"pb-5"}>
      <span className={"text-muted small ps-2 pt-2"}>{props.entityTitle}</span>
      {props.title.length > 0 && (
        <Stack direction={"horizontal"}>
          <span
            style={{ overflowWrap: "anywhere", userSelect: "text" }}
            className={"ps-2 pe-2 pb-2 fs-5 fw-bold"}
          >
            {props.title}
          </span>
        </Stack>
      )}
      {props.actions.length > 0 && (
        <Stack
          direction={"horizontal"}
          className={"border-top border-bottom mb-2"}
        >
          {props.actions.map((action: DetailPaneAction) => (
            <NavbarButton
              key={action.title}
              onClick={action.action}
              disabled={props.loading}
              className={"flex-grow-1 justify-content-center"}
            >
              {props.loading && (
                <Spinner size={"sm"} className={"me-2"}></Spinner>
              )}
              <i className={`bi bi-${action.icon} me-1`}></i>
              {action.title}
            </NavbarButton>
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
      <div className={"flex-grow-1"}></div>
    </Stack>
  );
}
