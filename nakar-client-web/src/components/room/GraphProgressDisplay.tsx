import { Card, CardBody, ProgressBar } from "react-bootstrap";
import { WSEventScenarioProgress } from "../../../src-gen";

export function GraphProgressDisplay(props: {
  graphProgress: WSEventScenarioProgress;
}) {
  if (props.graphProgress.progress == null) {
    return null;
  }
  return (
    <Card>
      <CardBody>
        <ProgressBar
          now={props.graphProgress.progress}
          max={1}
          label={`${(props.graphProgress.progress * 100).toFixed(0)}%`}
          style={{ width: "300px" }}
        />
        <div>{props.graphProgress.message ?? "..."}</div>
      </CardBody>
    </Card>
  );
}
