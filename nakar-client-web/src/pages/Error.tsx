import { Stack } from "react-bootstrap";
import { NavbarButton } from "../shared/elements/NavbarButton.tsx";
import { useNavigate, useRouteError } from "react-router";
import { handleError } from "../shared/error/handleError.ts";
import { Router } from "../routing/Router.ts";

export function ErrorComp() {
  const navigate = useNavigate();
  const error = useRouteError();

  return (
    <Stack
      className={"justify-content-center align-items-center h-100"}
      gap={2}
    >
      <span className={"small text-muted"}>Something went wrong:</span>
      <span className={"small text-muted font-monospace user-select-text"}>
        {handleError(error)}
      </span>
      <NavbarButton
        title={"Back to start"}
        onClick={async () => {
          await navigate(Router.getHomeUrl());
        }}
      ></NavbarButton>
    </Stack>
  );
}
