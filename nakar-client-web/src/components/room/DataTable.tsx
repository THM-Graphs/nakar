import { Stack, Table } from "react-bootstrap";
import { useBearStore } from "../../lib/state/useBearStore.ts";

export function DataTable() {
  const tableData = useBearStore((s) => s.room.scenario.graph.table.data);

  if (tableData.length === 0) {
    return <p className={"p-3 text-muted"}>No data</p>;
  }

  return (
    <Stack
      style={{
        flexGrow: "1",
        height: "100%",
        width: "100%",
        overflow: "auto",
        zIndex: 1,
      }}
      className={"bg-body"}
    >
      <Table className={"table-responsive"}>
        <thead>
          <tr className={"sticky-top"}>
            {Object.keys(tableData[0]).map((key) => (
              <th key={key} className={"user-select-text border-bottom"}>
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
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
