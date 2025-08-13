import { Action } from "./Action.ts";
import { NavbarButton } from "../components/shared/NavbarButton.tsx";
import { CSSProperties } from "react";
import { Placement } from "react-bootstrap/types";

export function ActionNavbarButton<T>(props: {
  action: Action<T>;
  params: T;
  className?: string;
  style?: CSSProperties;
  size?: "sm" | "big";
  customTitle?: string;
  hideTitle?: boolean;
  tooltipPlacement?: Placement;
}) {
  const title = props.customTitle ?? props.action.title(props.params);
  return (
    <NavbarButton
      title={props.hideTitle ? undefined : title}
      disabled={props.action.disabled(props.params)}
      onClick={() => props.action.run(props.params)}
      key={props.action.slug()}
      className={props.className}
      style={props.style}
      size={props.size}
      icon={props.action.icon(props.params) ?? undefined}
      tooltip={props.hideTitle ? title : undefined}
      tooltipPlacement={props.tooltipPlacement}
    ></NavbarButton>
  );
}
