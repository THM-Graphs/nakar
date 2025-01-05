import { Badge, Button, Stack } from "react-bootstrap";

export function TableDataWindowButton(props: {
  rowCount: number;
  onToggle: () => void;
  isOpen: boolean;
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
      <Stack
        direction={"horizontal"}
        gap={2}
        className={"align-items-baseline"}
      >
        <i className={"bi bi-table"}></i>
        <span>Data</span>
        <Badge bg="primary">{props.rowCount}</Badge>
      </Stack>
    </Button>
  );
}
