import { useBearStore } from "../../state/useBearStore.ts";
import { Stack } from "react-bootstrap";
import clsx from "clsx";

export function PerformanceDisplay() {
  const performance = useBearStore((s) => s.room.ui.performance);

  if (performance == null) {
    return null;
  }

  const isGood = performance.performance === "good";

  if (isGood) {
    return null;
  }

  return (
    <Stack
      direction={"horizontal"}
      gap={2}
      className={clsx(
        "ps-2 pe-2 pt-1 pb-1 small bg-warning text-black rounded align-self-center flex-shrink-0 pe-auto user-select-text shadow-sm",
      )}
    >
      <span>
        Load:{" "}
        <span className={""}>{(performance.loadPercent * 100).toFixed()}%</span>
      </span>
      <span>
        Tick Duration:{" "}
        <span className={""}>{performance.tickDuration.toFixed()}ms</span>
      </span>
      <span>
        Tick Count:{" "}
        <span className={""}>{performance.tickCount.toFixed()}</span>
      </span>
    </Stack>
  );
}
