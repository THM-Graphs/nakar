import { Stack } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { useEffect, useState } from "react";
import { DateTool } from "../../shared/data/DateTool.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { DateTimeSpanSelect } from "../../shared/date-time-span-select/DateTimeSpanSelect.tsx";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import {
  actionControllerLoadScenario,
  ScenarioArgumentDto,
} from "../../../src-gen";

export function CanvasBottomToolBar(props: { roomContext: CanvasContext }) {
  const metaData = useBearStore((s) => s.room.scenario.graph.metaData);
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const currentArguments = metaData.arguments;
  const parameters = metaData.scenario?.parameters ?? [];

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

  const getInitialStartDate = () =>
    DateTool.formatSomeDate(
      dateTimeValueFromArgument(
        startDateArgument?.value ?? startDateParameter?.defaultValue ?? null,
      ),
    );
  const getInitialEndDate = () =>
    DateTool.formatSomeDate(
      dateTimeValueFromArgument(
        endDateArgument?.value ?? endDateParameter?.defaultValue ?? null,
      ),
    );

  const [startDateTime, setStartDateTime] = useState<string | null>(
    getInitialStartDate(),
  );
  const [endDateTime, setEndDateTime] = useState<string | null>(
    getInitialEndDate(),
  );
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    setStartDateTime(() => getInitialStartDate());
    setEndDateTime(() => getInitialEndDate());
  }, [getInitialStartDate(), getInitialEndDate()]);

  const rerunScenario = (params: { startDate: string; endDate: string }) => {
    (async (): Promise<void> => {
      const scenario = metaData.scenario;
      if (scenario == null) {
        throw new Error(
          "Unable to run scenario: There is no scenario in this room.",
        );
      }

      const newArguments: ScenarioArgumentDto[] = [];
      for (const oldArgument of metaData.arguments) {
        if (oldArgument.identifier === startDateParameter?.identifier) {
          newArguments.push({
            value: params.startDate,
            identifier: oldArgument.identifier,
          });
        } else if (oldArgument.identifier === endDateParameter?.identifier) {
          newArguments.push({
            value: params.endDate,
            identifier: oldArgument.identifier,
          });
        } else {
          newArguments.push(oldArgument);
        }
      }

      try {
        await resultOrThrow(
          await actionControllerLoadScenario({
            path: { canvasId: props.roomContext.initialCanvasData.id },
            body: {
              scenarioId: scenario.id,
              arguments: newArguments,
              additive: false, // TODO
            },
          }),
        );
      } catch (error) {
        pushErrorNotification(error);
      }
    })().catch(console.error);
  };

  const reset = () => {
    setStartDateTime(startDateParameter?.defaultValue ?? "");
    setEndDateTime(endDateParameter?.defaultValue ?? "");
    rerunScenario({
      startDate: startDateParameter?.defaultValue ?? "",
      endDate: endDateParameter?.defaultValue ?? "",
    });
  };

  if (startDateTime == null || endDateTime == null) {
    return null;
  }

  return (
    <Stack
      className={"border flex-grow-0 bg-body z-2 rounded bg-body-tertiary"}
      direction={"horizontal"}
    >
      <Stack className={"align-items-start flex-grow-1"}>
        <Stack direction={"horizontal"}>
          <NavbarButton
            icon={collapsed ? "chevron-right" : "chevron-down"}
            className={"flex-grow-0 align-self-baseline"}
            onClick={() => {
              setCollapsed((c) => !c);
            }}
          ></NavbarButton>
          {collapsed && (
            <Stack
              className={"align-self-baseline small text-muted"}
              direction={"horizontal"}
              gap={2}
            >
              <i className={"bi bi-calendar-date"}></i>
              <span className={"user-select-text"}>
                {DateTool.parseExactLocalDate(startDateTime)?.toLocaleString()}
              </span>
              <i className={"bi bi-arrow-right"}></i>
              <span className={"user-select-text"}>
                {DateTool.parseExactLocalDate(endDateTime)?.toLocaleString()}
              </span>
            </Stack>
          )}
          {!collapsed && (
            <NavbarButton
              title={"Reset"}
              onClick={() => {
                reset();
              }}
            ></NavbarButton>
          )}
        </Stack>
        {!collapsed && (
          <DateTimeSpanSelect
            className={"mb-2"}
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            onStartDateTimeChange={(d) => {
              setStartDateTime(d);
              rerunScenario({ startDate: d, endDate: endDateTime });
            }}
            onEndDateTimeChange={(d) => {
              setEndDateTime(d);
              rerunScenario({ startDate: startDateTime, endDate: d });
            }}
            onSpanDateTimeChange={(start, end) => {
              setStartDateTime(start);
              setEndDateTime(end);
              rerunScenario({ startDate: start, endDate: end });
            }}
          ></DateTimeSpanSelect>
        )}
      </Stack>
    </Stack>
  );
}

function dateTimeValueFromArgument(argument: string | null): Date | null {
  if (argument == null) {
    return null;
  }
  return DateTool.parseExactLocalDate(argument);
}
