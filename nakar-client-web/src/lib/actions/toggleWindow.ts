import { IState } from "../state/IState";
import { useStore } from "../state/useStore";
import { Action } from "./Action.ts";

export function toggleWindow(): Action {
  return () => {
    useStore.setState((state: IState): void => {
      state.scenariosWindow.opened = !state.scenariosWindow.opened;
    });
  };
}
