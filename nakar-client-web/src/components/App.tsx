import { Stack } from "react-bootstrap";
import { ScenariosWindow } from "./ScenariosWindow.tsx";
import { AppNavbar } from "./AppNavbar.tsx";
import { useBearStore } from "../lib/State.ts";
import { Canvas } from "./Canvas.tsx";
import { useTheme } from "../lib/Theme.ts";
import { useEffect } from "react";

export default function App() {
  const scenariosWindowOpened = useBearStore(
    (state) => state.scenariosWindow.opened,
  );
  const [, setTheme] = useTheme();

  useEffect(() => {
    setTheme(null);
  }, [setTheme]);

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
