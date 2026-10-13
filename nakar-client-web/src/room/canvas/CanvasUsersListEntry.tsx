import { Stack } from "react-bootstrap";
import { UserPreviewDto } from "api-client";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import clsx from "clsx";

export function CanvasUsersListEntry(props: { user: UserPreviewDto }) {
  const rendererMode = useBearStore((s) => s.room.canvas.renderer.mode);
  const cursorVisible = useBearStore(
    (s) => !s.room.canvas.hiddenUserCursors.includes(props.user.id),
  );
  const setUserCursorVisible = useBearStore(
    (s) => s.room.canvas.setUserCursorVisible,
  );

  const textMuted = rendererMode === "webgl" && !cursorVisible;

  return (
    <Stack
      className={
        "small z-1 rounded bg-body-tertiary shadow-sm border ps-2 pe-auto user-select-text align-self-end"
      }
      direction={"horizontal"}
      gap={1}
    >
      <i className={clsx("bi bi-person", textMuted && "text-muted")} />
      {props.user.displayName ? (
        <span className={clsx(textMuted && "text-muted")}>
          {props.user.displayName}
        </span>
      ) : (
        <span className={clsx(textMuted && "text-muted")}>
          Guest ({props.user.id})
        </span>
      )}
      {rendererMode === "webgl" && (
        <NavbarButton
          className={"ms-auto"}
          size={"sm"}
          buttonType={"button"}
          icon={cursorVisible ? "eye" : "eye-slash"}
          tooltip={cursorVisible ? "Hide cursor" : "Show cursor"}
          onClick={() => {
            setUserCursorVisible(props.user.id, !cursorVisible);
          }}
        />
      )}
    </Stack>
  );
}
