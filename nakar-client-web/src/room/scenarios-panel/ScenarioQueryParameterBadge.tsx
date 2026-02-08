import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { ScenarioParameterDto } from "../../../src-gen";

export function ScenarioQueryParameterBadge(props: {
  parameter: ScenarioParameterDto;
}) {
  return (
    <OverlayTrigger
      overlay={
        <Tooltip>
          This scenario requires arguments:{" "}
          <span className={"font-monospace"}>
            ${props.parameter.identifier}
          </span>
        </Tooltip>
      }
      key={props.parameter.identifier}
    >
      <Stack
        direction={"horizontal"}
        gap={1}
        className={
          "bg-body-tertiary rounded-pill ps-2 pe-2 align-items-baseline align-self-center border"
        }
        style={{ fontSize: "12px" }}
      >
        <i className={"bi bi-code-square small text-mutedd"}></i>{" "}
        <span className={""}>{props.parameter.title}</span>
      </Stack>
    </OverlayTrigger>
  );
}
