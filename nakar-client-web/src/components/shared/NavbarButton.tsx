import clsx from "clsx";
import { OverlayTrigger, Spinner, Stack, Tooltip } from "react-bootstrap";
import {
  CSSProperties,
  forwardRef,
  MouseEvent,
  ReactElement,
  ReactNode,
  useState,
} from "react";
import { useBearStore } from "../../lib/state/useBearStore.ts";
import { Placement } from "react-bootstrap/types";

export const NavbarButton = forwardRef<
  HTMLDivElement,
  {
    icon?: string;
    title?: ReactNode;
    selected?: boolean;
    disabled?: boolean;
    onToggle?: (selected: boolean) => void;
    onClick?: (event: MouseEvent) => void | Promise<void>;
    className?: string;
    children?: ReactNode;
    size?: "sm" | "big";
    style?: CSSProperties;
    tooltip?: string;
    tooltipPlacement?: Placement;
  }
>((props, ref) => {
  const [loading, setLoading] = useState<boolean>(false);
  const disabled = props.disabled || loading;
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const button: ReactElement = (
    <OverlayTrigger
      placement={props.tooltipPlacement}
      delay={{ show: 1000, hide: 0 }}
      overlay={props.tooltip ? <Tooltip>{props.tooltip}</Tooltip> : <></>}
    >
      <Stack
        ref={ref}
        direction={"horizontal"}
        onClick={(event: MouseEvent) => {
          (async () => {
            if (disabled) {
              return;
            }
            props.onToggle?.(!(props.selected ?? false));
            if (props.onClick) {
              setLoading(true);
              try {
                await props.onClick(event);
              } catch (error) {
                pushErrorNotification(error);
              }
              setLoading(false);
            }
          })().catch(pushErrorNotification);
        }}
        className={clsx(
          "flex-shrink-0 position-relative overflow-hidden",
          props.selected ? "bg-body-secondary" : "",
          disabled ? "" : "pointer",
          disabled ? "" : "bg-body-secondary-hover",
          props.className,
        )}
        style={{
          ...(props.style ? props.style : {}),
        }}
      >
        <Stack
          gap={2}
          direction={"horizontal"}
          className={clsx(
            props.size == "sm" && "ps-1 pe-1 pt-0 pb-0",
            props.size == null && "ps-2 pe-2 pt-1 pb-1",
            props.size == "big" && "ps-3 pe-3 pt-2 pb-2 fs-5",
          )}
          style={{ opacity: disabled ? 0.3 : 1 }}
        >
          {loading ? (
            <Spinner animation="border" role="status" size={"sm"}>
              <span className="visually-hidden">Loading…</span>
            </Spinner>
          ) : (
            props.icon && (
              <i
                className={clsx("bi", `bi-${props.icon} flex-shrink-0 small`)}
              ></i>
            )
          )}

          {props.title && (
            <span className={"ellipsis flex-shrink-1 small"}>
              {props.title}
            </span>
          )}
          {props.children}
        </Stack>
      </Stack>
    </OverlayTrigger>
  );

  return button;
});
