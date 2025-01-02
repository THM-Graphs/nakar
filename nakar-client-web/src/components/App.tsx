import { Stack } from "react-bootstrap";
import { AppNavbar } from "./AppNavbar.tsx";
import { Canvas } from "./Canvas.tsx";
import { SideToolbar } from "./SideToolbar.tsx";
import { DataTable } from "./DataTable.tsx";
import { ScenariosList } from "./ScenariosList.tsx";
import { useContext, useEffect } from "react";
import { ThemeManagerContext } from "../lib/theme/ThemeManagerContext.ts";
import { useStore } from "../lib/state/useStore.ts";

export default function App() {
  const scenariosWindowOpened = useStore(
    (state) => state.scenariosWindow.opened,
  );
  const tableDataOpened = useStore((state) => state.canvas.tableDataOpened);

  const themeManager = useContext(ThemeManagerContext);

  useEffect(() => {
    themeManager.bootstrapTheme();
  }, [themeManager]);

  return (
    <>
      <Stack style={{ height: "100%" }}>
        <AppNavbar></AppNavbar>
        <Stack
          direction={"horizontal"}
          className={"align-items-stretch flex-grow-1"}
          style={{ height: "100px" }}
        >
          <SideToolbar visible={scenariosWindowOpened} width={500}>
            <ScenariosList></ScenariosList>
          </SideToolbar>
          <Canvas></Canvas>
          <SideToolbar visible={tableDataOpened} width={700}>
            <DataTable></DataTable>
          </SideToolbar>
        </Stack>
      </Stack>
    </>
  );
}
