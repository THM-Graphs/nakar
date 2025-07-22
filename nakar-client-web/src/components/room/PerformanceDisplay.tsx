import { useBearStore } from "../../lib/state/useBearStore.ts";
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
        "border-start pe-2 flex-grow-0 flex-shrink-0 small bg-warning ps-2 text-black",
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
    </Stack>
  );
}
