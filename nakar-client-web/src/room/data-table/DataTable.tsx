import { Stack, Table } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";

export function DataTable() {
  const tableData = useBearStore((s) => s.room.scenario.graph.table.data);
  const scenario = useBearStore((s) => s.room.scenario.graph.metaData.scenario);

  return (
    <Stack
      style={{
        flexGrow: "1",
        height: "100%",
        width: "100%",
        overflow: "auto",
      }}
      className={"bg-body z-1"}
    >
      {tableData.length === 0 ? (
        <Stack
          className={"flex-grow-1 align-items-center justify-content-center"}
        >
          <p className={"p-3 text-muted"}>
            No table data in scenario. Add a table query.
          </p>
          {scenario?.current.editUrl && (
            <NavbarButton
              title={"Add Table Query"}
              icon={"plus-lg"}
              className={"border align-self-center"}
              onClick={() => {
                window.open(scenario.current.editUrl ?? undefined);
              }}
            ></NavbarButton>
          )}
        </Stack>
      ) : (
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
      )}
    </Stack>
  );
}
