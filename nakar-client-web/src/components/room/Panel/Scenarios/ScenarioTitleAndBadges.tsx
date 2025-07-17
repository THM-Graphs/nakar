import { Button, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import clsx from "clsx";
import { Scenario } from "../../../../../src-gen";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { MouseEvent } from "react";

export function ScenarioTitleAndBadges(props: {
  scenario: Scenario;
  onRun?: (event: MouseEvent) => void;
  className?: string;
}) {
  const uiLocked = useBearStore((s) => s.room.ui.locked);
  return (
    <Stack
      direction={"horizontal"}
      className={clsx("align-items-baseline", props.className)}
      gap={1}
    >
      <Button
        variant={"link"}
        disabled={uiLocked}
        size={"sm"}
        onClick={(event) => {
          props.onRun?.(event);
        }}
        className={"p-0"}
      >
        <i className={clsx("bi bi-play-circle-fill")}></i>
      </Button>
      {props.scenario.parameters.length > 0 && (
        <OverlayTrigger
          overlay={<Tooltip>This scenario requires arguments.</Tooltip>}
        >
          <i className={"bi bi-code-square small text-mutedd"}></i>
        </OverlayTrigger>
      )}
      {props.scenario.additive && (
        <OverlayTrigger
          overlay={<Tooltip>This scenario adds elements to the graph.</Tooltip>}
        >
          <i className={"bi bi-plus-square small"}></i>
        </OverlayTrigger>
      )}
      <span className={"pe-1 small text-wrap"}>{props.scenario.title}</span>
    </Stack>
  );
}
