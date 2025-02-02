import { Card, CardBody, ProgressBar } from "react-bootstrap";
import { WSEventGraphProgress } from "../../../src-gen";

export function GraphProgressDisplay(props: {
  graphProgress: WSEventGraphProgress;
}) {
  return (
    <Card>
      <CardBody>
        <ProgressBar
          now={props.graphProgress.progress}
          max={1}
          label={`${(props.graphProgress.progress * 100).toFixed(0)}%`}
          style={{ width: "300px" }}
        />
        <div>{props.graphProgress.message}</div>
      </CardBody>
    </Card>
  );
}
