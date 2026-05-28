import { EventWsdto } from "api-client";

export interface ServerToClientEvents {
  message: (message: EventWsdto) => void;
}
