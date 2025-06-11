import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { loadEnvOrDefault } from "./lib/env/env.ts";
import { client } from "../src-gen";
import { themeManager } from "./lib/theme/ThemeManagerContext.ts";
import { Start, StartLoader } from "./pages/Start.tsx";
import { Room, RoomLoader } from "./pages/Room.tsx";
import { AppContext } from "./lib/state/AppContext.ts";

async function bootstrap() {
  themeManager.bootstrapTheme();

  const env = await loadEnvOrDefault();
  client.setConfig({
    baseUrl: env.BACKEND_URL,
  });

  const context = new AppContext(env);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Start context={context}></Start>,
      loader: StartLoader,
    },
    {
      path: "/room/:id",
      element: <Room context={context}></Room>,
      loader: RoomLoader,
    },
  ]);

  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

bootstrap().catch(console.error);
