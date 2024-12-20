import { ErrorView } from "../components/ErrorView.tsx";
import { Stack } from "react-bootstrap";
import { useRouteError } from "react-router";

export function ErrorPage() {
  const error = useRouteError();
  return (
    <>
      <Stack className={"p-3"}>
        <ErrorView error={error}></ErrorView>
      </Stack>
    </>
  );
}
