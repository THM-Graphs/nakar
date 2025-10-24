import { Stack } from "react-bootstrap";
import { Database, Node } from "../../../src-gen";
import { Label } from "../labels/Label.tsx";
import { RoomContext } from "../../pages/Room.tsx";
import { ClipboardButton } from "../../shared/elements/ClipboardButton.tsx";
import { ActionNavbarButton } from "../../actions/ActionNavbarButton.tsx";
import { SpawnNodeAction } from "../../actions/SpawnNodeAction.ts";

export function SearchResultEntry(props: {
  node: Node;
  roomContext: RoomContext;
  databaseId: string;
}) {
  return (
    <Stack direction={"horizontal"} className={"border-bottom"}>
      <Stack gap={1} className={"p-2"}>
        <Stack direction={"horizontal"} className={"flex-wrap"} gap={1}>
          {props.node.labels.map((label) => (
            <Label
              label={label}
              showAmount={false}
              showSources={false}
              roomContext={props.roomContext}
              key={label}
              className={"z-2"}
            ></Label>
          ))}
        </Stack>
        <span className={"small user-select-text"}>{props.node.title}</span>
      </Stack>
      <ClipboardButton
        text={props.node.id}
        className={"align-self-stretch"}
      ></ClipboardButton>
      <ActionNavbarButton
        action={SpawnNodeAction.shared}
        params={{
          nodeId: props.node.id,
          roomContext: props.roomContext,
          databaseId: props.databaseId,
        }}
        hideTitle={true}
        className={"align-self-stretch"}
        tooltipPlacement={"right"}
      ></ActionNavbarButton>
    </Stack>
  );
}
