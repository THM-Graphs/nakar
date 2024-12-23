import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import App from "./components/App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import { userTheme } from "./lib/Theme.ts";

userTheme.next(null);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App></App>,
  },
]);

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
