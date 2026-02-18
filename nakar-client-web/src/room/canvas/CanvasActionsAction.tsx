import { Action } from "../actions/Action.ts";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import clsx from "clsx";

export function CanvasActionsAction<T>(props: {
  action: Action<T>;
  params: T;
  className?: string;
}) {
  return (
    <ActionNavbarButton
      action={props.action}
      tooltipPlacement={"bottom"}
      params={props.params}
      className={clsx("align-self-start border-1", props.className)}
      hideTitle={true}
    ></ActionNavbarButton>
  );
}
