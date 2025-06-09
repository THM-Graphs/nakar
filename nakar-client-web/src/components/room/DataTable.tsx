import { Stack, Table } from "react-bootstrap";

export function DataTable(props: {
  tableData: Record<string, unknown>[] | null;
}) {
  if (props.tableData == null || props.tableData.length === 0) {
    return <p className={"p-3 text-muted"}>No data</p>;
  }

  return (
    <Stack
      style={{
        flexGrow: "1",
        height: "100%",
        width: "100%",
        overflow: "auto",
      }}
    >
      <Table className={"table-responsive"}>
        <thead>
          <tr>
            {Object.keys(props.tableData[0]).map((key) => (
              <th key={key} className={"user-select-text"}>
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.tableData.map((row, index) => (
            <tr key={index}>
              {Object.entries(row).map(([key, value]) => (
                <td
                  key={key}
                  style={{ fontSize: "10px", lineHeight: "1.5em" }}
                  className={"font-monospace user-select-text"}
                >
                  {JSON.stringify(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Stack>
  );
}
