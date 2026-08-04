import { Stack } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { CanvasUsersListEntry } from "./CanvasUsersListEntry.tsx";

export function CanvasUsersList() {
  const users = useBearStore((s) => s.room.scenario.graph.metaData.users);

  return (
    <Stack direction={"vertical"} gap={1} className={"flex-grow-0"}>
      {users.map((user) => (
        <CanvasUsersListEntry user={user} key={user.id}></CanvasUsersListEntry>
      ))}
    </Stack>
  );
}
