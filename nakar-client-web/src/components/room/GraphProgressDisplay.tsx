import { Card, CardBody, ProgressBar, Stack } from "react-bootstrap";
import { WSEventScenarioProgress } from "../../../src-gen";
import { useEffect, useState } from "react";

export function GraphProgressDisplay(props: {
  graphProgress: WSEventScenarioProgress;
}) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const timeout = setInterval(() => {
      setDots((oldDots) => (oldDots.length > 2 ? "" : oldDots + "."));
    }, 500);

    return () => {
      clearInterval(timeout);
    };
  }, []);

  if (props.graphProgress.progress == null) {
    return null;
  }
  return (
    <Card>
      <CardBody>
        <ProgressBar
          now={props.graphProgress.progress}
          max={1}
          animated={true}
          label={`${(props.graphProgress.progress * 100).toFixed(0)}%`}
          style={{ width: "300px" }}
        />
        <Stack direction="horizontal" className="gap-1">
          <span>{(props.graphProgress.message ?? "") + dots}</span>
        </Stack>
      </CardBody>
    </Card>
  );
}
