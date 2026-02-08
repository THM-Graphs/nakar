import { Stack } from "react-bootstrap";
import { NodePreviewDisplay } from "../inspector-panel/NodePreviewDisplay.tsx";
import clsx from "clsx";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { RemoveNoteAction } from "../actions/RemoveNoteAction.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { EditNoteAction } from "../actions/EditNoteAction.ts";
import { NoteDto } from "../../../src-gen";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";
import MDEditor from "@uiw/react-md-editor";

export function NoteDisplay(props: { note: NoteDto }) {
  const roomContext = useCanvasContext();
  const note = props.note;
  const isLoggedIn = useIsLoggedIn();

  const dateDisplay = (note: NoteDto): string => {
    const stringToUse = note.dateTime;
    return new Date(stringToUse).toLocaleString();
  };

  return (
    <Stack key={note.id} className={"border-bottom border-top bg-body"}>
      <Stack gap={1} className={"p-1"}>
        <Stack direction={"horizontal"} className={"justify-content-between"}>
          <span
            className={clsx(
              "small text-muted user-select-text",
              note.author == null && "fst-italic",
            )}
          >
            {note.author?.displayName ?? "Anonymous"}
          </span>
          <span className={"small text-muted user-select-text"}>
            {dateDisplay(note)}
          </span>
        </Stack>
        <Stack>
          <Stack direction={"horizontal"} className={"flex-wrap"}>
            <DynamicList
              collapsable={false}
              previewLimit={3}
              data={note.nodes}
              className={"flex-row flex-wrap"}
              render={(list) => (
                <>
                  {list.map((node) => (
                    <NodePreviewDisplay
                      key={node.id}
                      node={node}
                      className={"me-1 mb-1 align-self-baseline"}
                    ></NodePreviewDisplay>
                  ))}
                </>
              )}
              entityNamePlural={"Nodes"}
            ></DynamicList>
          </Stack>
        </Stack>
        <span
          className={
            "font-monospace user-select-text small markdown text-break"
          }
        >
          <MDEditor.Markdown source={note.content} style={{ width: "100%" }} />
        </span>
      </Stack>
      <Stack
        className={"border-top justify-content-end"}
        direction={"horizontal"}
      >
        <ActionNavbarButton
          action={EditNoteAction.shared}
          params={{ note: props.note, isLoggedIn: isLoggedIn }}
          hideTitle={true}
        ></ActionNavbarButton>
        <ActionNavbarButton
          action={RemoveNoteAction.shared}
          params={{
            noteId: props.note.id,
            roomContext: roomContext,
            isLoggedIn: isLoggedIn,
          }}
          hideTitle={true}
        ></ActionNavbarButton>
      </Stack>
    </Stack>
  );
}
