import {
  Card,
  CardBody,
  OverlayTrigger,
  ProgressBar,
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
    progress: 0,
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

  if (graphProgress.progress == null) {
    return null;
  }
  const message = graphProgress.message ?? "Working";
  return (
    <Stack className={"border-start ps-2 pe-2"} direction={"horizontal"}>
      <ProgressBar
        now={graphProgress.progress}
        max={1}
        animated={true}
        label={`${(graphProgress.progress * 100).toFixed(0)}%`}
        style={{ width: "200px" }}
        className={"me-2"}
      />
      <OverlayTrigger
        delay={{ show: 500, hide: 0 }}
        overlay={<Tooltip>{message}</Tooltip>}
        placement={"bottom"}
      >
        <span
          className={"small text-muted"}
          style={{
            width: "200px",
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
