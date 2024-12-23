import { Stack } from "react-bootstrap";
import { ScenariosWindow } from "./ScenariosWindow.tsx";
import { AppNavbar } from "./AppNavbar.tsx";
import { useBearStore } from "../lib/State.ts";
import { Canvas } from "./Canvas.tsx";

export default function App() {
  const scenariosWindowOpened = useBearStore(
    (state) => state.scenariosWindow.opened,
  );

  return (
    <>
      <Stack style={{ height: "100%" }}>
        <AppNavbar></AppNavbar>
        <Canvas>
          {scenariosWindowOpened && <ScenariosWindow></ScenariosWindow>}
        </Canvas>
      </Stack>
    </>
  );
}
