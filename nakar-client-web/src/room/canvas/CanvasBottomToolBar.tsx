import { Stack } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { useState } from "react";
import { ScenarioArgument } from "../../../src-gen";
import { DateTool } from "../../data/DateTool.ts";

export function CanvasBottomToolBar() {
  const scenario = useBearStore((s) => s.room.scenario.graph.metaData.scenario);
  const currentArguments = useBearStore(
    (s) => s.room.scenario.graph.metaData.arguments,
  );

  const parameters = scenario?.current.parameters ?? [];

  const startDateParameters = parameters.filter(
    (p) => p.dataType === "startDateTime",
  );
  const startDateParameter =
    startDateParameters.length > 0 ? startDateParameters[0] : null;
  const startDateArguments = currentArguments.filter(
    (a) => a.identifier === startDateParameter?.identifier,
  );
  const startDateArgument =
    startDateArguments.length > 0 ? startDateArguments[0] : null;

  const endDateParameters = parameters.filter(
    (p) => p.dataType === "endDateTime",
  );
  const endDateParameter =
    endDateParameters.length > 0 ? endDateParameters[0] : null;
  const endDateArguments = currentArguments.filter(
    (a) => a.identifier === endDateParameter?.identifier,
  );
  const endDateArgument =
    endDateArguments.length > 0 ? endDateArguments[0] : null;

  const [startDateTime, setStartDateTime] = useState<Date>(
    dateTimeValueFromArgument(startDateArgument) ?? new Date(),
  );
  const [endDateTime, setEndDateTime] = useState<Date>(
    dateTimeValueFromArgument(endDateArgument) ?? new Date(),
  );

  if (startDateParameter == null && endDateParameter == null) {
    return null;
  }

  return (
    <Stack
      className={"border-top flex-grow-0 bg-body z-2 justify-content-between"}
      direction={"horizontal"}
    >
      <Stack>
        <span>Start Date Time</span>
        <span>{startDateTime.toLocaleString()}</span>
      </Stack>
      <Stack>
        <span>End Date Time</span>
        <span>{endDateTime.toLocaleString()}</span>
      </Stack>
    </Stack>
  );
}

function dateTimeValueFromArgument(
  argument: ScenarioArgument | null,
): Date | null {
  if (argument == null) {
    return null;
  }
  return DateTool.parseExactLocalDate(argument.value);
}
