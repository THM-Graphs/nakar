import { DatabaseList } from "./DatabaseList.tsx";
import { Panel } from "../Panel.tsx";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../pages/Room.tsx";

export function ScenariosPanel(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const shown = useBearStore((s) => s.room.panels.scenarios.shown);
  const hide = useBearStore((s) => s.room.panels.scenarios.hide);

  return (
    <Panel
      hidden={!shown}
      direction={"left"}
      onClose={hide}
      title={"Scenarios"}
    >
      <DatabaseList
        context={props.context}
        roomContext={props.roomContext}
      ></DatabaseList>
    </Panel>
  );
}
