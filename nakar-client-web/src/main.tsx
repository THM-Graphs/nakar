import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { loadEnvOrDefault } from "./shared/env/env.ts";
import { client as client2, redirectControllerGetUrl } from "../src-gen";
import { Start, StartLoader } from "./pages/Start.tsx";
import { CanvasLoader, CanvasPage } from "./pages/CanvasPage.tsx";
import { AppContext } from "./state/AppContext.ts";
import { applyTheme, bootstrapTheme } from "./shared/theme/ThemeManager.ts";
import { useBearStore } from "./state/useBearStore.ts";
import { AuthModal } from "./shared/auth/AuthModal.tsx";
import { ErrorComp } from "./pages/Error.tsx";
import { Project, ProjectLoader } from "./pages/Project.tsx";
import { Room, RoomLoader } from "./pages/Room.tsx";
import { AddEditProject } from "./pages/AddEditProject.tsx";

async function bootstrap() {
  bootstrapTheme();

  const env = await loadEnvOrDefault();
  client2.setConfig({
    baseUrl: env.BACKEND_URL,
  });

  handleRedirect();

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
      client2.setConfig({
        headers: {
          Authorization: jwt ? `Bearer ${jwt}` : null,
        },
      });
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
          path: "/project/add",
          element: <AddEditProject context={context}></AddEditProject>,
        },
        {
          path: "/project/:id/edit",
          element: <AddEditProject context={context}></AddEditProject>,
          loader: ProjectLoader,
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

function handleRedirect(): void {
  // Feature for handling outdated urls
  const path: string = window.location.pathname;
  if (path === "/") {
    return;
  } else {
    const href = window.location.href;
    console.log(`Will try to find redirect for ${href}`);
    redirectControllerGetUrl({ query: { url: href } })
      .then((result) => {
        if (result.data != null) {
          window.location.href = result.data.url;
        }
      })
      .catch(() => {
        /* */
      });
  }
}
