import { Stack, Table } from "react-bootstrap";

export function DataTable(props: {
  tableData: Record<string, unknown>[] | null;
}) {
  if (props.tableData == null) {
    return null;
  }

  return (
    <Stack className={"shadow border-start overflow-auto"}>
      <Table className={"table-responsive"}>
        <thead>
          <tr>
            {Object.keys(props.tableData[0]).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.tableData.map((row, index) => (
            <tr key={index}>
              {Object.entries(row).map(([key, value]) => (
                <td key={key}>{JSON.stringify(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Stack>
  );
}
