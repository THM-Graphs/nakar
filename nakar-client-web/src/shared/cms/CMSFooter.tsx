import { Stack } from "react-bootstrap";
import { AuthButton } from "../auth/AuthButton.tsx";
import { StatusBar } from "../bars/StatusBar.tsx";

export function CMSFooter() {
  return (
    <StatusBar
      right={
        <Stack direction={"horizontal"}>
          <AuthButton></AuthButton>
        </Stack>
      }
      className={"border-top"}
    ></StatusBar>
  );
}
