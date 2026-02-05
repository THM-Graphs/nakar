import { Stack } from "react-bootstrap";
import { useNavigate, useRouteError } from "react-router";
import { handleError } from "../shared/error/handleError.ts";
import { Router } from "../routing/Router.ts";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { usePageTitle } from "../routing/usePageTitle.ts";

export function ErrorComp() {
  const navigate = useNavigate();
  const error = useRouteError();

  usePageTitle("Error");

  return (
    <>
      <Stack
        className={"justify-content-center align-items-center h-100"}
        gap={3}
      >
        <span className={"small text-muted"}>Something went wrong:</span>
        <span className={"small text-muted font-monospace user-select-text"}>
          {handleError(error)}
        </span>
        <CMSButton
          title={"Back to start"}
          onClick={() => {
            void navigate(Router.getHomeUrl());
          }}
        ></CMSButton>
      </Stack>
    </>
  );
}
