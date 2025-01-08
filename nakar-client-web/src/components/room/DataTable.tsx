import { Stack, Table } from "react-bootstrap";
import { GetInitialGraph } from "../../../src-gen";

export function DataTable(props: { graph: GetInitialGraph | null }) {
  if (props.graph == null || props.graph.tableData.length == 0) {
    return null;
  }

  return (
    <Stack className={"shadow border-start overflow-auto"}>
      <Table className={"table-responsive"}>
        <thead>
          <tr>
            {Object.keys(props.graph.tableData[0]).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.graph.tableData.map((row, index) => (
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
