import { Action } from "../actions/Action.ts";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";

export function CanvasActionsAction<T>(props: {
  action: Action<T>;
  params: T;
  variant?: "sm";
}) {
  return (
    <ActionNavbarButton
      action={props.action}
      tooltipPlacement={"left"}
      params={props.params}
      className={"align-self-start border-1"}
      hideTitle={props.variant === "sm"}
    ></ActionNavbarButton>
  );
}
