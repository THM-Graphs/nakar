import clsx from "clsx";
import { Stack } from "react-bootstrap";
import { forwardRef, MouseEvent } from "react";

export const NavbarButton = forwardRef<
  HTMLDivElement,
  {
    icon?: string;
    title?: string;
    selected?: boolean;
    disabled?: boolean;
    onToggle?: (selected: boolean) => void;
    onClick?: (event: MouseEvent) => void;
    className?: string;
  }
>((props, ref) => {
  return (
    <Stack
      ref={ref}
      gap={2}
      direction={"horizontal"}
      onClick={(event: MouseEvent) => {
        if (props.disabled) {
          return;
        }
        props.onToggle?.(!(props.selected ?? false));
        props.onClick?.(event);
      }}
      className={clsx(
        "border-start border-end rounded-0 ps-2 pe-2 small text-muted",
        props.selected ? "bg-body-secondary" : "",
        props.disabled ? "" : "pointer",
        props.className,
      )}
      style={{
        opacity: props.disabled ? 0.3 : 1,
      }}
    >
      {props.icon && <i className={clsx("bi", `bi-${props.icon}`)}></i>}
      {props.title && <span>{props.title}</span>}
    </Stack>
  );
});
