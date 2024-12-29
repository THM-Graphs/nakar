import { GetInitialGraphDto } from "../../shared/dto";
import { HTTPError } from "../backend/HTTPError";
import { IState } from "../state/IState";
import { useStore } from "../state/useStore";
import { Action } from "./Action.ts";
import { Backend } from "../backend/Backend.ts";

export function loadInitialGraph(scenarioId: string): Action {
  return async (backend: Backend) => {
    try {
      const result: GetInitialGraphDto =
        await backend.getInitialGraph(scenarioId);
      useStore.setState((state: IState): void => {
        state.canvas.graph = result;
      });
    } catch (error) {
      const httpError = error as HTTPError;
      alert(`${httpError.name}\n\n${httpError.message}`);
    }
  };
}
