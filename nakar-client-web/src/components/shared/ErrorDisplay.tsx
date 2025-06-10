import { Alert, Button } from "react-bootstrap";

export function ErrorDisplay(props: {
  message: string;
  onReload?: () => void;
}) {
  return (
    <Alert
      variant={"danger"}
      className={
        "d-flex align-items-center rounded-0 border-start-0 border-end-0 border-top-0"
      }
    >
      <span className={"me-auto"}>{props.message}</span>
      {props.onReload && (
        <Button onClick={props.onReload} variant={""}>
          <i className={"bi bi-arrow-clockwise"}></i>
        </Button>
      )}
    </Alert>
  );
}
