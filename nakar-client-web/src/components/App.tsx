import { Stack } from "react-bootstrap";
import { AppNavbar } from "./AppNavbar.tsx";
import { useBearStore } from "../lib/State.ts";
import { Canvas } from "./Canvas.tsx";
import { useTheme } from "../lib/Theme.ts";
import { useEffect } from "react";
import { SideToolbar } from "./SideToolbar.tsx";
import { DataTable } from "./DataTable.tsx";
import { ScenariosList } from "./ScenariosList.tsx";

export default function App() {
  const scenariosWindowOpened = useBearStore(
    (state) => state.scenariosWindow.opened,
  );
  const tableDataOpened = useBearStore((state) => state.canvas.tableDataOpened);
  const [, setTheme] = useTheme();

  useEffect(() => {
    setTheme(null);
  }, [setTheme]);

  return (
    <>
      <Stack style={{ height: "100%" }}>
        <AppNavbar></AppNavbar>
        <Stack
          direction={"horizontal"}
          className={"align-items-stretch flex-grow-1"}
          style={{ height: "100px" }}
        >
          <SideToolbar visible={scenariosWindowOpened} width={600}>
            <ScenariosList></ScenariosList>
          </SideToolbar>
          <Canvas></Canvas>
          <SideToolbar visible={tableDataOpened} width={500}>
            <DataTable></DataTable>
          </SideToolbar>
        </Stack>
      </Stack>
    </>
  );
}
