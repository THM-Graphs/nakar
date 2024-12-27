import { Stack, Table } from "react-bootstrap";
import { useBearStore } from "../lib/State.ts";

export function DataTable() {
  const data = useBearStore((state) => state.canvas.graph.tableData);

  if (data.length == 0) {
    return null;
  }

  return (
    <Stack className={"shadow border-start"}>
      <Table>
        <thead>
          <tr>
            {Object.keys(data[0]).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={JSON.stringify(row)}>
              {Object.entries(row).map(([key, value]) => (
                <td key={key}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Stack>
  );
}
