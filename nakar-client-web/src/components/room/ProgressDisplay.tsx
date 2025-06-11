import {
  Card,
  CardBody,
  OverlayTrigger,
  ProgressBar,
  Spinner,
  Stack,
  Tooltip,
} from "react-bootstrap";
import { WSEventScenarioProgress } from "../../../src-gen";
import { useEffect, useState } from "react";
import { WebSocketsManager } from "../../lib/ws/WebSocketsManager.ts";

export function ProgressDisplay(props: {
  webSocketsManager: WebSocketsManager;
}) {
  const [graphProgress, setGraphProgress] = useState<WSEventScenarioProgress>({
    type: "WSEventScenarioProgress",
    progress: null,
    message: null,
  });
  const [dots, setDots] = useState("");

  useEffect(() => {
    const subs = [
      props.webSocketsManager.onScenarioProgress$.subscribe((progress) => {
        setGraphProgress(progress);
      }),
    ];

    return () => {
      for (const sub of subs) {
        sub.unsubscribe();
      }
    };
  }, [props.webSocketsManager]);

  useEffect(() => {
    const timeout = setInterval(() => {
      setDots((oldDots) => (oldDots.length > 2 ? "" : oldDots + "."));
    }, 500);

    return () => {
      clearInterval(timeout);
    };
  }, []);

  if (graphProgress.progress == null && graphProgress.message == null) {
    return null;
  }
  const message = graphProgress.message ?? "Working";
  return (
    <Stack className={"border-start ps-2 pe-2"} direction={"horizontal"}>
      {graphProgress.progress ? (
        <ProgressBar
          now={graphProgress.progress}
          max={1}
          animated={true}
          label={`${(graphProgress.progress * 100).toFixed(0)}%`}
          style={{ width: "100px" }}
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
      <OverlayTrigger
        delay={{ show: 500, hide: 0 }}
        overlay={<Tooltip>{message}</Tooltip>}
        placement={"bottom"}
      >
        <span
          className={"small text-muted"}
          style={{
            width: "150px",
            textOverflow: "ellipsis",
            overflow: "hidden",
            textWrap: "nowrap",
          }}
        >
          {message + dots}
        </span>
      </OverlayTrigger>
    </Stack>
  );
}
