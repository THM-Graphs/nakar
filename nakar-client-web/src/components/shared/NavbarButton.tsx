import clsx from "clsx";
import { Stack } from "react-bootstrap";
import { forwardRef, MouseEvent, ReactNode } from "react";

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
    children?: ReactNode;
    size?: "sm";
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
        event.stopPropagation();
        props.onToggle?.(!(props.selected ?? false));
        props.onClick?.(event);
      }}
      className={clsx(
        "rounded-0 ps-2 pe-2 small flex-shrink-1",
        props.selected ? "bg-body-secondary" : "",
        props.disabled ? "" : "pointer",
        props.disabled ? "" : "bg-body-secondary-hover",
        props.className,
        props.size == "sm" ? "" : "pt-1 pb-1",
      )}
      style={{
        opacity: props.disabled ? 0.3 : 1,
      }}
    >
      {props.icon && (
        <i className={clsx("bi", `bi-${props.icon} flex-shrink-0`)}></i>
      )}
      {props.title && (
        <span
          className={"overflow-hidden text-nowrap flex-shrink-1"}
          style={{ textOverflow: "ellipsis" }}
        >
          {props.title}
        </span>
      )}
      {props.children}
    </Stack>
  );
});
