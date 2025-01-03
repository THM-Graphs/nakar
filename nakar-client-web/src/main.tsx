import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { bootstrapEnv, env } from "./lib/env/env.ts";
import { client } from "../src-gen";
import { themeManager } from "./lib/theme/ThemeManagerContext.ts";
import { Start } from "./pages/Start.tsx";
import { Room, RoomLoader } from "./pages/Room.tsx";

async function bootstrap() {
  themeManager.bootstrapTheme();

  await bootstrapEnv();
  client.setConfig({
    baseUrl: `${env().BACKEND_URL}/api/frontend`,
  });

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Start></Start>,
    },
    {
      path: "/room/:id",
      element: <Room></Room>,
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
