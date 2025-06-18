import { Database } from "../../../../../src-gen";
import { DatabaseDisplay } from "./DatabaseDisplay.tsx";
import { Stack } from "react-bootstrap";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../pages/Room.tsx";

export function DatabaseList(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const scenarios = useBearStore((s) => s.room.panels.scenarios.scenarios);
  return (
    <Stack className={"pb-5 mb-auto"}>
      {scenarios.databases.map((database: Database) => (
        <DatabaseDisplay
          context={props.context}
          key={database.id}
          database={database}
          roomContext={props.roomContext}
        ></DatabaseDisplay>
      ))}
    </Stack>
  );
}
