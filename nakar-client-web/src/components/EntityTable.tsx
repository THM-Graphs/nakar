import { Stack, Table } from "react-bootstrap";
import { ReactElement } from "react";

export function EntityTable(props: {
  title: string;
  headers: string[];
  lines: Array<ReactElement>;
}) {
  return (
    <>
      <Stack
        gap={3}
        className={"flex-shrink-1 flex-grow-1"}
        style={{ width: "100px" }}
      >
        <Stack
          className={"mt-3 ms-3 me-3 flex-shrink-0 flex-grow-0"}
          direction={"horizontal"}
        >
          <h2>{props.title}</h2>
        </Stack>
        <div
          className={"overflow-scroll flex-shrink-1 flex-grow-1"}
          style={{ height: "100px" }}
        >
          <Table striped>
            <thead className={"position-sticky top-0"}>
              <tr>
                {props.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>{props.lines}</tbody>
          </Table>
        </div>
      </Stack>
    </>
  );
}
