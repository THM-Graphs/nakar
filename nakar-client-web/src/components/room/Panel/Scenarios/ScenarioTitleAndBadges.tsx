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

  const title: string = props.scenario.title ?? "untitled";
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
      {props.scenario.additive && (
        <OverlayTrigger
          overlay={<Tooltip>This scenario adds elements to the graph.</Tooltip>}
        >
          <i className={"bi bi-plus-square small"}></i>
        </OverlayTrigger>
      )}
      <Stack gap={1} className={"flex-wrap"} direction={"horizontal"}>
        <span className={"pe-1 small text-wrap align-self-baseline"}>
          {title}
        </span>
        {props.scenario.parameters.map((p) => (
          <OverlayTrigger
            overlay={<Tooltip>This scenario requires arguments.</Tooltip>}
          >
            <Stack
              direction={"horizontal"}
              gap={1}
              className={
                "bg-body rounded-pill ps-2 pe-2 align-items-baseline align-self-baseline"
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
