import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// @ts-expect-error Workaround
import "bootstrap/dist/css/bootstrap.css";
// @ts-expect-error Workaround
import "bootstrap-icons/font/bootstrap-icons.css";
// @ts-expect-error Workaround
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Home } from "./pages/Home.tsx";
import {
  DatabaseDefinitions,
  DatabaseDefinitionsLoader,
} from "./pages/DatabaseDefinitions.tsx";
import { Scenarios, ScenariosLoader } from "./pages/Scenarios.tsx";
import { client } from "../src-gen/open-api-client";
import { ErrorPage } from "./pages/ErrorPage.tsx";

client.setConfig({
  baseUrl: "http://localhost:3000",
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App></App>,
    children: [
      {
        index: true,
        element: <Home></Home>,
      },
      {
        path: "database-definitions",
        element: <DatabaseDefinitions></DatabaseDefinitions>,
        loader: DatabaseDefinitionsLoader,
        errorElement: <ErrorPage></ErrorPage>,
      },
      {
        path: "scenarios",
        element: <Scenarios></Scenarios>,
        loader: ScenariosLoader,
        errorElement: <ErrorPage></ErrorPage>,
      },
    ],
  },
]);

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
