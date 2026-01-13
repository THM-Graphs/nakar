import { ActionWsdto } from "../../../src-gen";

export interface ClientToServerEvents {
  message: (message: ActionWsdto) => void;
}
