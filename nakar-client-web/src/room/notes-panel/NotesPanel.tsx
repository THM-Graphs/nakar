import { RoomContext } from "../../pages/Room.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Panel } from "../../shared/elements/Panel.tsx";
import { Stack } from "react-bootstrap";
import { ActionNavbarButton } from "../../actions/ActionNavbarButton.tsx";
import { AddNoteAction } from "../../actions/AddNoteAction.ts";
import { Node } from "../../../src-gen";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { NoteDisplay } from "./NoteDisplay.tsx";
import { AppContext } from "../../state/AppContext.ts";

export function NotesPanel(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const notesPanel = useBearStore((s) => s.room.panels.notes);
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);
  const elements = useBearStore((s) => s.room.panels.inspector.element);
  const selectedNodes = elements.reduce<Node[]>((akku, next) => {
    const foundNode = graphElements.nodes.find((e) => e.id === next);
    if (foundNode) {
      return [...akku, foundNode];
    } else {
      return akku;
    }
  }, []);
  const notes = useBearStore((s) => s.room.scenario.graph.elements.notes);

  return (
    <Panel
      hidden={leftPanel !== "notes"}
      direction={"left"}
      title={"Notes"}
      onClose={() => {
        notesPanel.hide();
      }}
    >
      <Stack className={"pb-5"} gap={0}>
        <ActionNavbarButton
          action={AddNoteAction.shared}
          params={{ nodes: selectedNodes, roomContext: props.roomContext }}
        ></ActionNavbarButton>
        <DynamicList
          data={notes}
          render={(notes) => (
            <Stack gap={3}>
              {notes.map((note) => (
                <NoteDisplay
                  note={note}
                  key={note.id}
                  roomContext={props.roomContext}
                ></NoteDisplay>
              ))}
            </Stack>
          )}
          entityNamePlural={"Notes"}
        ></DynamicList>
      </Stack>
    </Panel>
  );
}
