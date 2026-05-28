import { ActionWsdto } from "api-client";

export interface ClientToServerEvents {
  message: (message: ActionWsdto) => void;
}
