import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { Stack } from "react-bootstrap";
import { RoomList } from "../components/start/RoomList.tsx";
import { Env } from "../lib/env/env.ts";

export function Start(props: { env: Env }) {
  return (
    <Stack style={{ height: "100%" }}>
      <AppNavbar env={props.env}></AppNavbar>
      <RoomList></RoomList>
    </Stack>
  );
}
