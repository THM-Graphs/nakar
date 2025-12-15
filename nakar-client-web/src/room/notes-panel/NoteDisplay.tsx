import { Note } from "../../../src-gen";
import { Stack } from "react-bootstrap";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NodePreviewDisplay } from "../inspector-panel/NodePreviewDisplay.tsx";
import clsx from "clsx";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { RemoveNoteAction } from "../actions/RemoveNoteAction.ts";
import { RoomContext } from "../../pages/Room.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { EditNoteAction } from "../actions/EditNoteAction.ts";

export function NoteDisplay(props: { note: Note; roomContext: RoomContext }) {
  const note = props.note;

  const dateDisplay = (note: Note): string => {
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
            {note.author ?? "Anonymous"}
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
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: "h4",
              h2: "h5",
              h3: "h6",
              h4: "h6",
              h5: "h6",
              h6: "h6",
            }}
          >
            {note.content}
          </Markdown>
        </span>
      </Stack>
      <Stack
        className={"border-top justify-content-end"}
        direction={"horizontal"}
      >
        <ActionNavbarButton
          action={EditNoteAction.shared}
          params={{ note: props.note }}
          hideTitle={true}
        ></ActionNavbarButton>
        <ActionNavbarButton
          action={RemoveNoteAction.shared}
          params={{ noteId: props.note.id, roomContext: props.roomContext }}
          hideTitle={true}
        ></ActionNavbarButton>
      </Stack>
    </Stack>
  );
}
