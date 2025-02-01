import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { loadEnvOrDefault } from "./lib/env/env.ts";
import { client } from "../src-gen";
import { themeManager } from "./lib/theme/ThemeManagerContext.ts";
import { Start } from "./pages/Start.tsx";
import { Room, RoomLoader } from "./pages/Room.tsx";
import { WebSocketsManager } from "./lib/ws/WebSocketsManager.ts";

async function bootstrap() {
  themeManager.bootstrapTheme();

  const env = await loadEnvOrDefault();
  client.setConfig({
    baseUrl: `${env.BACKEND_URL}/api/frontend`,
  });

  const webSockets = new WebSocketsManager(env);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Start env={env}></Start>,
    },
    {
      path: "/room/:id",
      element: <Room webSockets={webSockets} env={env}></Room>,
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
