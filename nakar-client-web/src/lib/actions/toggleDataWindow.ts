import { IState } from "../state/IState";
import { useStore } from "../state/useStore";
import { Action } from "./Action.ts";

export function toggleDataWindow(): Action {
  return () => {
    useStore.setState((state: IState): void => {
      state.canvas.tableDataOpened = !state.canvas.tableDataOpened;
    });
  };
}
