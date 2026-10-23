import { useCanvasContext } from "../../pages/Canvas.tsx";
import { Dropdown, Stack } from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import clsx from "clsx";
import { Router } from "../../routing/Router.ts";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CanvasDto, publicRoomControllerGetRoom } from "api-client";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useAppContext } from "../../state/AppContextData.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { createPortal } from "react-dom";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { ActionDropdownItem } from "../actions/ActionDropdownItem.tsx";
import { CanvasTabActionParams } from "../actions/CanvasTabActionParams.ts";
import { CreateCanvasAction } from "../actions/CreateCanvasAction.ts";
import { CloseCanvasAction } from "../actions/CloseCanvasAction.ts";
import { CloseOtherCanvasesAction } from "../actions/CloseOtherCanvasesAction.ts";
import { DuplicateCanvasAction } from "../actions/DuplicateCanvasAction.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";

export function CanvasTabs() {
  const canvasContext = useCanvasContext();
  const { webSocketsManager } = useAppContext();
  const navigate = useNavigate();
  const roomId = canvasContext.initialRoomData.id;
  const activeCanvasId = canvasContext.initialCanvasData.id;
  const [canvases, setCanvases] = useState(
    canvasContext.initialRoomData.canvases,
  );
  const [busy, setBusy] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    canvas: CanvasDto;
    x: number;
    y: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (contextMenu == null || menuRef.current == null) {
      return;
    }
    const bounds = menuRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(contextMenu.x, window.innerWidth - bounds.width),
    );
    const y = Math.max(
      0,
      Math.min(contextMenu.y, window.innerHeight - bounds.height),
    );
    if (x !== contextMenu.x || y !== contextMenu.y) {
      setContextMenu({ ...contextMenu, x, y });
    }
  }, [contextMenu]);

  useEffect(() => {
    if (contextMenu == null) {
      return;
    }
    const close = () => {
      setContextMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("resize", close);
    document.addEventListener("scroll", close, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", close);
      document.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);
  const socketState = useBearStore((s) => s.room.websockets.state);
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  const listRevision = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const updateCanvases = (nextCanvases: CanvasDto[]) => {
    if (!mounted.current) {
      return;
    }
    setCanvases(nextCanvases);
    setContextMenu((current) =>
      current != null &&
      !nextCanvases.some((canvas) => canvas.id === current.canvas.id)
        ? null
        : current,
    );
    if (!nextCanvases.some((canvas) => canvas.id === activeCanvasId)) {
      if (nextCanvases.length > 0) {
        const fallback = nextCanvases[0];
        void navigate(Router.getCanvasPath(roomId, fallback.id), {
          replace: true,
        });
      }
    }
  };

  useEffect(() => {
    const subscription = webSocketsManager.onMessage$.subscribe(({ event }) => {
      if (
        event.type === "RoomCanvasesChangedWsdto" &&
        event.roomId === roomId
      ) {
        listRevision.current += 1;
        updateCanvases(event.canvases);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [webSocketsManager, roomId, activeCanvasId]);

  useEffect(() => {
    if (
      socketState.type !== "connected" &&
      socketState.type !== "connect_error"
    ) {
      return;
    }
    let cancelled = false;
    const revision = listRevision.current;
    // Refresh after reconnect to include changes made while this client was offline.
    publicRoomControllerGetRoom({ path: { roomId } })
      .then(resultOrThrow)
      .then((room) => {
        if (!cancelled && revision === listRevision.current) {
          updateCanvases(room.canvases);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          pushErrorNotification(error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [socketState.type, roomId, activeCanvasId]);

  const isCurrent = () => mounted.current;

  const execute = async (operation: () => Promise<void>) => {
    if (busy || !mounted.current) {
      return;
    }
    setBusy(true);
    try {
      await operation();
    } finally {
      if (isCurrent()) {
        setBusy(false);
      }
    }
  };

  const refresh = async () => {
    if (!mounted.current) {
      return;
    }
    const revision = listRevision.current;
    const room = resultOrThrow(
      await publicRoomControllerGetRoom({ path: { roomId } }),
    );
    if (revision === listRevision.current) {
      updateCanvases(room.canvases);
    }
  };

  const actionParams = (canvas: CanvasDto): CanvasTabActionParams => ({
    roomContext: canvasContext,
    canvas,
    canvasCount: canvases.length,
    busy,
    navigate,
    execute,
    refresh,
    isCurrent,
  });

  return (
    <>
      <Stack direction="horizontal" className="flex-shrink-0">
        <nav
          aria-label="Canvases"
          className="d-flex overflow-x-auto flex-grow-1 flex-wrap"
          style={{ minWidth: 0 }}
        >
          <div
            style={{ width: "5px" }}
            className={"border-bottom flex-shrink-0 flex-grow-0"}
          ></div>
          {canvases.map((canvas) => (
            <Stack
              key={canvas.id}
              direction="horizontal"
              onContextMenu={(event) => {
                event.preventDefault();
                if (busy) {
                  return;
                }
                const bounds = event.currentTarget.getBoundingClientRect();
                setContextMenu({
                  canvas,
                  x: event.clientX || bounds.left,
                  y: event.clientY || bounds.bottom,
                });
              }}
              className={clsx(
                "flex-shrink-0 rounded-top overflow-hidden bg-body-hover",
                canvas.id === activeCanvasId
                  ? "bg-body border-top border-start border-end"
                  : "border-bottom",
              )}
            >
              <Link
                to={Router.getCanvasPath(roomId, canvas.id)}
                aria-current={canvas.id === activeCanvasId ? "page" : undefined}
                title={canvas.title}
                className="text-body text-decoration-none small ps-2 align-self-stretch flex-shrink-1 flex-grow-1 ellipsis d-flex align-items-center"
                style={{ maxWidth: "300px", minWidth: "180px" }}
              >
                <span>{canvas.title}</span>
              </Link>
              <NavbarButton
                className="align-self-stretch"
                aria-label={`Delete canvas ${canvas.title}`}
                disabled={CloseCanvasAction.shared.disabled(
                  actionParams(canvas),
                )}
                onClick={() => {
                  CloseCanvasAction.shared.runAsync(actionParams(canvas));
                }}
              >
                <i className="bi bi-x" aria-hidden="true"></i>
              </NavbarButton>
            </Stack>
          ))}
          <ActionNavbarButton
            action={CreateCanvasAction.shared}
            params={actionParams(canvasContext.initialCanvasData)}
            hideTitle={true}
            className={"border-bottom rounded-top"}
          ></ActionNavbarButton>
          <div
            style={{ width: "50px" }}
            className={"border-bottom flex-shrink-0 flex-grow-1"}
          ></div>
        </nav>
      </Stack>
      {contextMenu != null &&
        createPortal(
          <Dropdown
            show
            onToggle={(show) => {
              if (!show) {
                setContextMenu(null);
              }
            }}
          >
            <Dropdown.Menu
              ref={menuRef}
              show
              role="menu"
              className="rounded"
              style={{
                position: "fixed",
                left: contextMenu.x,
                top: contextMenu.y,
                margin: 0,
                zIndex: 1060,
              }}
            >
              <ActionDropdownItem
                action={CloseCanvasAction.shared}
                params={actionParams(contextMenu.canvas)}
              ></ActionDropdownItem>
              <ActionDropdownItem
                action={CloseOtherCanvasesAction.shared}
                params={actionParams(contextMenu.canvas)}
              ></ActionDropdownItem>
              <Dropdown.Divider></Dropdown.Divider>
              <ActionDropdownItem
                action={DuplicateCanvasAction.shared}
                params={actionParams(contextMenu.canvas)}
              ></ActionDropdownItem>
            </Dropdown.Menu>
          </Dropdown>,
          document.body,
        )}
    </>
  );
}
