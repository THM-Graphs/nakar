import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import clsx from "clsx";
import { ScnearioPlayButton } from "./ScenarioPlayButton";
import { ScenarioArgumentDto, ScenarioDto } from "../../../src-gen-2";

export function ScenarioTitleAndBadges(props: {
  scenario: ScenarioDto;
  onRun?: (additive: boolean, scenarioArguments: ScenarioArgumentDto[]) => void;
  className?: string;
  arguments?: ScenarioArgumentDto[];
}) {
  const title: string = props.scenario.title ?? "untitled";
  return (
    <Stack
      direction={"horizontal"}
      className={clsx("", props.className)}
      gap={1}
    >
      <Stack direction="horizontal" className="align-self-baseline">
        <ScnearioPlayButton
          onClick={(event) => {
            event.stopPropagation();
            props.onRun?.(false, props.arguments ?? []);
          }}
          icon="play-circle-fill"
        ></ScnearioPlayButton>
        <ScnearioPlayButton
          onClick={(event) => {
            event.stopPropagation();
            props.onRun?.(true, props.arguments ?? []);
          }}
          icon="plus-circle-fill"
        ></ScnearioPlayButton>
      </Stack>
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
