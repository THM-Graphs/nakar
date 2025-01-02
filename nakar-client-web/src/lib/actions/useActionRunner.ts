import { useContext } from "react";
import { BackendContext } from "../backend/BackendContext.ts";
import { Action } from "./Action.ts";
import { Backend } from "../backend/Backend.ts";

export function useActionRunner() {
  const backend: Backend = useContext(BackendContext);

  return (action: Action) => () => {
    Promise.resolve(action(backend)).catch(console.error);
  };
}
