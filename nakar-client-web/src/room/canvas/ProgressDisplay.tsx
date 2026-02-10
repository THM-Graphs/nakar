import { ProgressBar, Spinner, Stack } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useBearStore } from "../../state/useBearStore.ts";
import { ProgressWsdto } from "../../../src-gen";
import clsx from "clsx";

export function ProgressDisplay() {
  const [dots, setDots] = useState("");
  const progress: ProgressWsdto | null = useBearStore(
    (s) => s.room.ui.progress,
  );
  // const progress: ProgressWsdto | null = {
  //   progress: null,
  //   message: "Loading...",
  //   type: "ProgressWsdto",
  // };

  useEffect(() => {
    const timeout = setInterval(() => {
      setDots((oldDots) => (oldDots.length > 2 ? "" : oldDots + "."));
    }, 500);

    return () => {
      clearInterval(timeout);
    };
  }, []);

  if (progress == null) {
    return null;
  }
  return (
    <Stack
      direction={"horizontal"}
      gap={2}
      className={clsx(
        "ps-2 pe-2 pt-1 pb-1 bg-body-tertiary rounded border align-self-center flex-shrink-0 user-select-text shadow-sm",
      )}
      style={{ width: "300px" }}
    >
      <Stack direction={"horizontal"}>
        {progress.progress ? (
          <ProgressBar
            now={progress.progress}
            max={1}
            animated={true}
            label={`${(progress.progress * 100).toFixed(0)}%`}
            className={"me-2"}
          />
        ) : (
          <Spinner
            animation="border"
            variant="primary"
            className={"me-2"}
            size={"sm"}
          />
        )}
        <span className={"small text-muted ellipsis"}>
          {progress.message + dots}
        </span>
      </Stack>
    </Stack>
  );
}
