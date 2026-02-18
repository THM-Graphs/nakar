import { useCanvasContext } from "../../pages/Canvas.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Panel } from "../../shared/elements/Panel.tsx";
import { Stack } from "react-bootstrap";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { AddNoteAction } from "../actions/AddNoteAction.ts";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { NoteDisplay } from "./NoteDisplay.tsx";
import { NodeDto, NoteDto } from "../../../src-gen";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";

export function NotesPanel() {
  const roomContext = useCanvasContext();
  const notesPanel = useBearStore((s) => s.room.panels.notes);
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);
  const elements = useBearStore((s) => s.room.panels.inspector.element);
  const selectedNodes = elements.reduce<NodeDto[]>((akku, next) => {
    const foundNode = graphElements.nodes.find((e) => e.id === next);
    if (foundNode) {
      return [...akku, foundNode];
    } else {
      return akku;
    }
  }, []);
  const notes: NoteDto[] = useBearStore((s) => s.room.scenario.graph.notes);
  const isLoggedIn: boolean = useIsLoggedIn();

  return (
    <Panel
      direction={"left"}
      title={"Notes"}
      onClose={() => {
        notesPanel.hide();
      }}
      toolbar={
        <ActionNavbarButton
          action={AddNoteAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: roomContext,
            isLoggedIn,
          }}
        ></ActionNavbarButton>
      }
    >
      <Stack className={""} gap={0}>
        <DynamicList
          data={notes}
          render={(notes) => (
            <Stack gap={3}>
              {notes.map((note) => (
                <NoteDisplay note={note} key={note.id}></NoteDisplay>
              ))}
            </Stack>
          )}
          entityNamePlural={"Notes"}
          className={""}
        ></DynamicList>
      </Stack>
    </Panel>
  );
}
