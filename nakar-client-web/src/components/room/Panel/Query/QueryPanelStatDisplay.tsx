import { Stack } from "react-bootstrap";
import clsx from "clsx";
import { useCallback } from "react";
import { numberFormat } from "../../../../lib/data/numberFormat.ts";

export function QueryPanelStatDisplay(props: {
  label: string;
  value: string;
  index: number;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={clsx(
        "align-items-baseline justify-content-between ps-1 pe-2 border-top",
        props.index % 2 === 0 && "bg-body",
      )}
    >
      <span className={"small"}>{props.label}</span>
      <span className={"small font-monospace user-select-text"}>
        {numberFormat(props.value)}
      </span>
    </Stack>
  );
}
