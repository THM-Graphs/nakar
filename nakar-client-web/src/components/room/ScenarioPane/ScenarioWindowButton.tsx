import { Stack } from "react-bootstrap";
import clsx from "clsx";

export function ScenarioWindowButton(props: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Stack
      direction={"horizontal"}
      onClick={() => {
        props.onToggle();
      }}
      className={clsx(
        "border-start border-end rounded-0 ps-2 pe-2 small pointer text-muted",
        props.isOpen ? "bg-body-secondary" : "",
      )}
    >
      <i className={"bi bi-easel-fill me-2"}></i>
      <span>Scenarios</span>
    </Stack>
  );
}
