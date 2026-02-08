import { useBearStore } from "../../state/useBearStore.ts";
import { Modal, Stack } from "react-bootstrap";
import { Panel } from "../../shared/elements/Panel.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { NodePreviewDisplay } from "../inspector-panel/NodePreviewDisplay.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import {
  canvasNoteControllerPostNote,
  canvasNoteControllerUpdateNote,
} from "../../../src-gen";
import MDEditor from "@uiw/react-md-editor";

type AddEditNoteModalMode = "create" | "update";

export function AddEditNoteModal() {
  const roomContext = useCanvasContext();
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
          await canvasNoteControllerPostNote({
            path: {
              roomId: roomContext.initialRoomData.id,
              canvasId: roomContext.initialCanvasData.id,
            },
            body: {
              nodeIds: nodes.map((node) => node.id),
              content: content,
            },
          }),
        );
      } else {
        await resultOrThrow(
          await canvasNoteControllerUpdateNote({
            path: {
              roomId: roomContext.initialRoomData.id,
              noteId: noteId,
              canvasId: roomContext.initialCanvasData.id,
            },
            body: {
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
        <Stack gap={0}>
          <Stack className={"p-2 flex-wrap"} direction={"horizontal"}>
            {nodes.map((node) => (
              <NodePreviewDisplay
                className={"m-1"}
                key={node.id}
                node={node}
                disableClick={true}
              ></NodePreviewDisplay>
            ))}
          </Stack>
          <MDEditor
            value={content}
            onChange={(e) => {
              setContent(e ?? "");
            }}
          />
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
