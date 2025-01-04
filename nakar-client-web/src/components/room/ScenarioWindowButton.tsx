import { Button } from "react-bootstrap";

export function ScenarioWindowButton(props: {
  scenarioWindowOpen?: boolean;
  toggleScenarioWindow?: () => void;
}) {
  if (props.scenarioWindowOpen == null) {
    return null;
  }
  return (
    <Button
      onClick={() => {
        props.toggleScenarioWindow?.();
      }}
      active={props.scenarioWindowOpen}
      variant={"secondary"}
      size={"sm"}
    >
      <i className={"bi bi-easel-fill me-2"}></i>
      <span>Scenarios</span>
    </Button>
  );
}
