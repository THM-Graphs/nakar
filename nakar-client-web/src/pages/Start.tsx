import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { Stack } from "react-bootstrap";
import { RoomList } from "../components/start/RoomList.tsx";
import { Env } from "../lib/env/env.ts";
import { InfoDropdown } from "../components/shared/InfoDropdown.tsx";

export function Start(props: { env: Env }) {
  return (
    <Stack style={{ height: "100%" }}>
      <AppNavbar
        right={<InfoDropdown env={props.env}></InfoDropdown>}
      ></AppNavbar>
      <RoomList></RoomList>
    </Stack>
  );
}
