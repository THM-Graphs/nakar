import { ProgressBar, Spinner, Stack } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useBearStore } from "../../lib/state/useBearStore.ts";

export function ProgressDisplay() {
  const [dots, setDots] = useState("");
  const progress = useBearStore((s) => s.room.ui.progress);

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
      className={"border-end ps-1 pe-2 flex-grow-0 flex-shrink-0"}
      direction={"horizontal"}
    >
      {progress.progress ? (
        <ProgressBar
          now={progress.progress}
          max={1}
          animated={true}
          label={`${(progress.progress * 100).toFixed(0)}%`}
          style={{ width: "200px" }}
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
      <span
        className={"small text-muted ellipsis"}
        style={{
          width: "200px",
        }}
      >
        {progress.message + dots}
      </span>
    </Stack>
  );
}
