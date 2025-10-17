import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { loadEnvOrDefault } from "./lib/env/env.ts";
import { client } from "../src-gen";
import { Start, StartLoader } from "./pages/Start.tsx";
import { Room, RoomLoader } from "./pages/Room.tsx";
import { AppContext } from "./lib/state/AppContext.ts";
import { applyTheme, bootstrapTheme } from "./lib/theme/ThemeManager.ts";
import { useBearStore } from "./lib/state/useBearStore.ts";
import { AuthModal } from "./components/shared/auth/AuthModal.tsx";

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
      <AuthModal></AuthModal>
    </StrictMode>,
  );
}

bootstrap().catch(console.error);
