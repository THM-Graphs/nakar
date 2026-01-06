import clsx from "clsx";
import {
  Button,
  OverlayTrigger,
  Spinner,
  Stack,
  Tooltip,
} from "react-bootstrap";
import {
  CSSProperties,
  forwardRef,
  MouseEvent,
  ReactElement,
  ReactNode,
  useState,
} from "react";
import { useBearStore } from "../../state/useBearStore.ts";
import { Placement } from "react-bootstrap/types";

export const NavbarButton = forwardRef<
  HTMLButtonElement,
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
    hidden?: boolean;
    buttonType?: "submit" | "button";
    variant?: "primary" | "normal";
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
      <Button
        hidden={props.hidden}
        ref={ref}
        variant={"light"}
        type={props.buttonType}
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
          "text-body fw-normal border-0 p-0 m-0 rounded-0 flex-shrink-0 position-relative overflow-hidden text-start",
          props.selected ? "bg-body-secondary" : "",
          disabled ? "" : "pointer",
          disabled ? "" : "bg-body-secondary-hover",
          props.className,
        )}
        style={{
          backgroundColor: props.selected ? "inherit" : "rgba(0, 0, 0, 0)",
          ...(props.style ? props.style : {}),
        }}
      >
        <Stack
          gap={2}
          direction={"horizontal"}
          className={clsx(
            "vertical-align-baseline",
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
                className={clsx(
                  "bi",
                  `bi-${props.icon} flex-shrink-0 small`,
                  props.variant === "primary" ? "text-primary" : "",
                )}
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
      </Button>
    </OverlayTrigger>
  );

  return button;
});
