import { Stack } from "react-bootstrap";
import { AuthButton } from "../shared/auth/AuthButton.tsx";
import { SocketStateDisplay } from "../shared/socket/SocketStateDisplay.tsx";
import { StatusBar } from "../shared/bars/StatusBar.tsx";

export function CMSFooter() {
  return (
    <StatusBar
      right={
        <Stack direction={"horizontal"}>
          <AuthButton></AuthButton>
          <SocketStateDisplay></SocketStateDisplay>
        </Stack>
      }
    ></StatusBar>
  );
}
