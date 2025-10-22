import { Label } from "./Label.tsx";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { RoomContext } from "../../pages/Room.tsx";

export function Labels(props: { roomContext: RoomContext }) {
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);

  return (
    <Stack
      className={"flex-wrap p-1 align-self-start bg-body"}
      direction={"horizontal"}
      gap={1}
      style={{}}
    >
      {graphElements.labels.map((label) => (
        <Label
          label={label.label}
          key={label.label}
          showAmount={true}
          showSources={true}
          roomContext={props.roomContext}
        ></Label>
      ))}
    </Stack>
  );
}
