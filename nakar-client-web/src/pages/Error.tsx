import { Stack } from "react-bootstrap";
import { useNavigate, useRouteError } from "react-router";
import { handleError } from "../shared/error/handleError.ts";
import { usePageTitle } from "../routing/usePageTitle.ts";
import { BackToStartButton } from "../shared/BackToStartButton.tsx";

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
        <BackToStartButton></BackToStartButton>
      </Stack>
    </>
  );
}
