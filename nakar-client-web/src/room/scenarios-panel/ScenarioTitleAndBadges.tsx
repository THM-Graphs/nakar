import { Stack } from "react-bootstrap";
import clsx from "clsx";
import { ScnearioPlayButton } from "./ScenarioPlayButton";
import { ScenarioArgumentDto, ScenarioDto } from "../../../src-gen";
import { ScenarioQueryParameterBadge } from "./ScenarioQueryParameterBadge.tsx";

export function ScenarioTitleAndBadges(props: {
  scenario: ScenarioDto;
  onRun?: (additive: boolean, scenarioArguments: ScenarioArgumentDto[]) => void;
  className?: string;
  arguments?: ScenarioArgumentDto[];
  hideParameters?: boolean;
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
        {props.hideParameters !== true &&
          props.scenario.parameters.map((p) => (
            <ScenarioQueryParameterBadge
              parameter={p}
              key={p.id}
            ></ScenarioQueryParameterBadge>
          ))}
      </Stack>
    </Stack>
  );
}
