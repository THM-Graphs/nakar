import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import { loadEnvOrDefault } from "./shared/env/env.ts";
import {
  authControllerGetAuth,
  client as client,
  redirectControllerGetUrl,
} from "../src-gen";
import { Start, StartLoader } from "./pages/Start.tsx";
import { CanvasLoader, CanvasPage } from "./pages/CanvasPage.tsx";
import { AppContext, AppContextData } from "./state/AppContextData.ts";
import { applyTheme, bootstrapTheme } from "./shared/theme/ThemeManager.ts";
import { useBearStore } from "./state/useBearStore.ts";
import { AuthModal } from "./shared/auth/AuthModal.tsx";
import { ErrorComp } from "./pages/Error.tsx";
import { Project, ProjectLoader } from "./pages/Project.tsx";
import { resultOrThrow } from "./shared/data/resultOrThrow.ts";
import { EditProject, EditProjectLoader } from "./pages/EditProject.tsx";
import { AddProject } from "./pages/AddProject.tsx";
import { EditScenario, EditScenarioLoader } from "./pages/EditScenario.tsx";
import {
  EditScenarioGroup,
  EditScenarioGroupLoader,
} from "./pages/EditScenarioGroup.tsx";
import { ScrollToTopWrapper } from "./routing/ScrollToTopWrapper.ts";
import { EditRoom, EditRoomLoader } from "./pages/EditRoom.tsx";
import {
  EditDatabaseConnection,
  EditDatabaseConnectionLoader,
} from "./pages/EditDatabaseConnection.tsx";

async function bootstrap() {
  bootstrapTheme();

  const env = await loadEnvOrDefault();
  client.setConfig({
    baseUrl: env.BACKEND_URL,
  });

  handleRedirect();

  const context = new AppContextData(env);

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

      (async () => {
        const res = resultOrThrow(await authControllerGetAuth());
        useBearStore.getState().global.auth.setUsername(res.username);
      })().catch(() => {
        useBearStore.getState().global.auth.setUsername(null);
      });
    },
    { fireImmediately: true },
  );

  const router = createBrowserRouter([
    {
      path: "/",
      errorElement: <ErrorComp></ErrorComp>,
      element: (
        <>
          <ScrollToTopWrapper>
            <Outlet />
          </ScrollToTopWrapper>
          <AuthModal></AuthModal>
        </>
      ),
      children: [
        {
          index: true,
          element: <Start></Start>,
          loader: StartLoader,
        },
        {
          path: "/canvas/:id",
          element: <CanvasPage></CanvasPage>,
          loader: CanvasLoader,
        },
        {
          path: "/project/add",
          element: <AddProject></AddProject>,
        },
        {
          path: "/project/:id/edit",
          element: <EditProject></EditProject>,
          loader: EditProjectLoader,
        },
        {
          path: "/project/:id",
          element: <Project></Project>,
          loader: ProjectLoader,
        },
        {
          path: "/project/:projectId/scenario-group/:scenarioGroupId/edit",
          element: <EditScenarioGroup></EditScenarioGroup>,
          loader: EditScenarioGroupLoader,
        },
        {
          path: "/project/:projectId/scenario-group/:scenarioGroupId/scenario/:scenarioId/edit",
          element: <EditScenario></EditScenario>,
          loader: EditScenarioLoader,
        },
        {
          path: "/project/:projectId/database-connection/:databaseConnectionId/edit",
          element: <EditDatabaseConnection></EditDatabaseConnection>,
          loader: EditDatabaseConnectionLoader,
        },
        {
          path: "/project/:projectId/room/:roomId/edit",
          element: <EditRoom></EditRoom>,
          loader: EditRoomLoader,
        },
      ],
    },
  ]);
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <AppContext.Provider value={context}>
        <RouterProvider router={router}></RouterProvider>
      </AppContext.Provider>
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
