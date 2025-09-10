import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import { Modal, Stack } from "react-bootstrap";
import { Panel } from "../Panel.tsx";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { NodePreviewDisplay } from "../Inspector/NodePreviewDisplay.tsx";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";
import { postNote, putNote } from "../../../../../src-gen";
import clsx from "clsx";

type AddEditNoteModalMode = "create" | "update";

export function AddEditNoteModal(props: { roomContext: RoomContext }) {
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const shown = useBearStore((s) => s.room.panels.notes.addNoteModal.shown);
  const close = useBearStore((s) => s.room.panels.notes.addNoteModal.close);
  const clean = useBearStore((s) => s.room.panels.notes.addNoteModal.clean);
  const noteId = useBearStore((s) => s.room.panels.notes.addNoteModal.noteId);
  const nodes = useBearStore((s) => s.room.panels.notes.addNoteModal.nodes);
  const content = useBearStore((s) => s.room.panels.notes.addNoteModal.content);
  const setContent = useBearStore(
    (s) => s.room.panels.notes.addNoteModal.setContent,
  );
  const mode: AddEditNoteModalMode = noteId == null ? "create" : "update";

  const handleClose = () => {
    close();
  };

  const handleAdd = async () => {
    try {
      if (noteId == null) {
        await resultOrThrow(
          await postNote({
            path: { id: props.roomContext.initialRoomData.id },
            body: {
              nodeIds: nodes.map((node) => node.id),
              content: content,
            },
          }),
        );
      } else {
        await resultOrThrow(
          await putNote({
            path: { id: props.roomContext.initialRoomData.id, noteId: noteId },
            body: {
              nodeIds: nodes.map((node) => node.id),
              content: content,
            },
          }),
        );
      }
      handleClose();
    } catch (error) {
      pushErrorNotification(error);
    }
  };

  const handleClean = () => {
    clean();
  };

  return (
    <Modal show={shown} onHide={handleClose} onExited={handleClean}>
      <Panel
        title={mode == "create" ? "Add Note" : "Edit Note"}
        onClose={handleClose}
        direction={"none"}
        hidden={false}
        fullWidth={true}
      >
        <Stack className={""} gap={0}>
          <Stack className={"p-2 flex-wrap"} direction={"horizontal"}>
            {nodes.map((node) => (
              <NodePreviewDisplay
                className={"m-1"}
                key={node.id}
                nodeId={node.id}
                nodeTitle={node.title}
                labels={node.labels}
                disableClick={true}
              ></NodePreviewDisplay>
            ))}
          </Stack>
          <textarea
            className={clsx(
              "border-0 small p-2",
              nodes.length > 0 && "border-top",
            )}
            placeholder={"# Markdown"}
            style={{
              height: "150px",
            }}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
            }}
          ></textarea>
        </Stack>
        <Stack
          direction={"horizontal"}
          className={"border-top justify-content-between"}
        >
          <NavbarButton
            title={"Cancel"}
            icon={"x-lg"}
            onClick={handleClose}
            className={"border-end"}
          ></NavbarButton>
          <NavbarButton
            onClick={handleAdd}
            icon={"floppy"}
            title={"Save"}
            className={"border-start"}
          ></NavbarButton>
        </Stack>
      </Panel>
    </Modal>
  );
}
