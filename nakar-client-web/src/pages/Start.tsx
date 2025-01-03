import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { Stack } from "react-bootstrap";
import { RoomList } from "../components/start/RoomList.tsx";

export function Start() {
  return (
    <Stack style={{ height: "100%" }}>
      <AppNavbar></AppNavbar>
      <RoomList></RoomList>
    </Stack>
  );
}
