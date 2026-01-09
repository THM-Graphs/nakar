import { ActionWsdto } from "../../../src-gen-2";

export interface ClientToServerEvents {
  message: (message: ActionWsdto) => void;
}
