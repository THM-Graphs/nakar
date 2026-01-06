import { Button, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import clsx from "clsx";
import { Scenario, ScenarioArgument } from "../../../src-gen";

export function ScenarioTitleAndBadges(props: {
  scenario: Scenario;
  onRun?: (additive: boolean, scenarioArguments: ScenarioArgument[]) => void;
  className?: string;
  arguments?: ScenarioArgument[];
}) {
  const title: string = props.scenario.title ?? "untitled";
  return (
    <Stack
      direction={"horizontal"}
      className={clsx("align-items-baseline", props.className)}
      gap={1}
    >
      <Button
        variant={"link"}
        size={"sm"}
        onClick={(event) => {
          event.stopPropagation();
          props.onRun?.(false, props.arguments ?? []);
        }}
        className={"p-0"}
      >
        <i className={clsx("bi bi-play-circle-fill")}></i>
      </Button>
      <Button
        variant={"link"}
        size={"sm"}
        onClick={(event) => {
          event.stopPropagation();
          props.onRun?.(true, props.arguments ?? []);
        }}
        className={"p-0"}
      >
        <i className={clsx("bi bi-plus-circle-fill")}></i>
      </Button>
      <Stack gap={1} className={"flex-wrap"} direction={"horizontal"}>
        <span className={"pe-1 small text-wrap align-self-baseline"}>
          {title}
        </span>
        {props.scenario.parameters.map((p) => (
          <OverlayTrigger
            overlay={<Tooltip>This scenario requires arguments.</Tooltip>}
            key={p.identifier}
          >
            <Stack
              direction={"horizontal"}
              gap={1}
              className={
                "bg-body-tertiary rounded-pill ps-2 pe-2 align-items-baseline align-self-baseline border"
              }
              style={{ fontSize: "12px" }}
            >
              <i className={"bi bi-code-square small text-mutedd"}></i>{" "}
              <span className={""}>{p.title}</span>
            </Stack>
          </OverlayTrigger>
        ))}
      </Stack>
    </Stack>
  );
}
