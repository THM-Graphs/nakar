import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { loadEnvOrDefault } from "./shared/env/env.ts";
import { client } from "../src-gen";
import { Start, StartLoader } from "./pages/Start.tsx";
import { CanvasLoader, CanvasPage } from "./pages/CanvasPage.tsx";
import { AppContext } from "./state/AppContext.ts";
import { applyTheme, bootstrapTheme } from "./shared/theme/ThemeManager.ts";
import { useBearStore } from "./state/useBearStore.ts";
import { AuthModal } from "./shared/auth/AuthModal.tsx";
import { ErrorComp } from "./pages/Error.tsx";
import { Project, ProjectLoader } from "./pages/Project.tsx";
import { Room, RoomLoader } from "./pages/Room.tsx";

async function bootstrap() {
  bootstrapTheme();

  const env = await loadEnvOrDefault();
  client.setConfig({
    baseUrl: env.BACKEND_URL,
  });

  const context = new AppContext(env);

  const getTheme = useBearStore.getState().global.theme.getTheme;
  useBearStore.subscribe(
    (s) => s.global.theme.user,
    () => {
      applyTheme(getTheme());
    },
  );
  useBearStore.subscribe(
    (s) => s.global.theme.system,
    () => {
      applyTheme(getTheme());
    },
  );

  useBearStore.subscribe(
    (s) => s.global.auth.jwt,
    (jwt) => {
      client.setConfig({
        headers: {
          Authorization: jwt ? `Bearer ${jwt}` : null,
        },
      });
      console.log("Did update auth token on client.");
    },
    { fireImmediately: true },
  );

  const router = createBrowserRouter([
    {
      path: "/",
      errorElement: <ErrorComp></ErrorComp>,
      children: [
        {
          index: true,
          element: <Start context={context}></Start>,
          loader: StartLoader,
        },
        {
          path: "/canvas/:id",
          element: <CanvasPage context={context}></CanvasPage>,
          loader: CanvasLoader,
        },
        {
          path: "/project/:id",
          element: <Project context={context}></Project>,
          loader: ProjectLoader,
        },
        {
          path: "/room/:id",
          element: <Room></Room>,
          loader: RoomLoader,
        },
      ],
    },
  ]);
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <RouterProvider router={router} />
      <AuthModal></AuthModal>
    </StrictMode>,
  );
}

bootstrap().catch(console.error);
