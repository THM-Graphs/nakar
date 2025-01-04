import { Badge, Button, Stack } from "react-bootstrap";

export function TableDataWindowButton(props: {
  tableDataLength?: number;
  toggleTableData?: () => void;
  tableDataOpened?: boolean;
}) {
  if (props.tableDataLength == null || props.tableDataLength == 0) {
    return null;
  }
  return (
    <Button
      onClick={() => {
        props.toggleTableData?.();
      }}
      active={props.tableDataOpened}
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
        {props.tableDataLength > 0 && (
          <Badge bg="primary">{props.tableDataLength}</Badge>
        )}
      </Stack>
    </Button>
  );
}
