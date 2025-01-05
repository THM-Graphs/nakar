import { Button } from "react-bootstrap";

export function ScenarioWindowButton(props: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      onClick={() => {
        props.onToggle();
      }}
      active={props.isOpen}
      variant={"secondary"}
      size={"sm"}
    >
      <i className={"bi bi-easel-fill me-2"}></i>
      <span>Scenarios</span>
    </Button>
  );
}
