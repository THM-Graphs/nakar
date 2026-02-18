import { Spinner, Stack } from "react-bootstrap";

export function LoadingPage() {
  return (
    <Stack className={"h-100 v-100 align-items-center justify-content-center"}>
      <Spinner></Spinner>
    </Stack>
  );
}
