import { handleError } from "../error/handleError";
import { IState } from "../state/IState";
import { useStore } from "../state/useStore";
import { Action } from "./Action.ts";
import { Backend } from "../backend/Backend.ts";

export function reloadScenarios(): Action {
  return async (backend: Backend) => {
    try {
      useStore.setState((state: IState): void => {
        state.scenariosWindow.scenarios = { type: "loading" };
      });
      const data = await backend.getScenarios();
      useStore.setState((state: IState): void => {
        state.scenariosWindow.scenarios = { type: "data", data: data };
      });
    } catch (error: unknown) {
      useStore.setState((state: IState): void => {
        state.scenariosWindow.scenarios = {
          type: "error",
          message: handleError(error),
        };
      });
    }
  };
}
