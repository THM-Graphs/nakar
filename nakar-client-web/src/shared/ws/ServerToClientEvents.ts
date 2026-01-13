import { EventWsdto } from "../../../src-gen";

export interface ServerToClientEvents {
  message: (message: EventWsdto) => void;
}
