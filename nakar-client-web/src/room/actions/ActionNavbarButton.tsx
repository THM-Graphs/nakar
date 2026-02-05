import { Action } from "./Action.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { CSSProperties, ReactNode } from "react";
import { Placement } from "react-bootstrap/types";
import clsx from "clsx";

export function ActionNavbarButton<T>(props: {
  action: Action<T>;
  params: T;
  className?: string;
  style?: CSSProperties;
  size?: "sm" | "big";
  customTitle?: string;
  hideTitle?: boolean;
  hideIcon?: boolean;
  tooltipPlacement?: Placement;
  children?: ReactNode;
}) {
  const title = props.customTitle ?? props.action.title(props.params);
  return (
    <NavbarButton
      title={props.hideTitle ? undefined : title}
      disabled={props.action.disabled(props.params)}
      onClick={() => props.action.run(props.params)}
      key={props.action.slug()}
      className={clsx(props.className)}
      style={{
        ...props.style,
      }}
      size={props.size}
      icon={
        props.hideIcon
          ? undefined
          : (props.action.icon(props.params) ?? undefined)
      }
      tooltip={props.hideTitle ? title : undefined}
      tooltipPlacement={props.tooltipPlacement}
    >
      {props.children}
    </NavbarButton>
  );
}
