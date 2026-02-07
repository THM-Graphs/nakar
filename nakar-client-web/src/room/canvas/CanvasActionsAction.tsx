import { Action } from "../actions/Action.ts";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";

export function CanvasActionsAction<T>(props: {
  action: Action<T>;
  params: T;
}) {
  return (
    <ActionNavbarButton
      action={props.action}
      tooltipPlacement={"bottom"}
      params={props.params}
      className={"align-self-start border-1"}
      hideTitle={true}
    ></ActionNavbarButton>
  );
}
