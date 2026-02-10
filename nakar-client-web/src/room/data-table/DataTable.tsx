import { Stack, Table } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";

export function DataTable() {
  const tableData = useBearStore((s) => s.room.scenario.graph.table.data);
  const selectGraph = useBearStore((s) => s.room.canvas.tabs.selectGraph);

  return (
    <Stack
      direction={"vertical"}
      className={
        "bg-body z-1 border rounded h-100 w-100 shadow-sm overflow-auto"
      }
    >
      <NavbarButton
        icon={"x-lg"}
        className={"align-self-end sticky-top"}
        onClick={() => {
          selectGraph();
        }}
      ></NavbarButton>
      {tableData.length === 0 ? (
        <Stack
          className={"flex-grow-1 align-items-center justify-content-center"}
        >
          <p className={"p-3 text-muted"}>
            No table data in scenario. Add a table query.
          </p>
        </Stack>
      ) : (
        <Table responsive={true} className={"rounded"}>
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
      )}
    </Stack>
  );
}
