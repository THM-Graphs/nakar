import { WSServerToClientMessage } from "../../../src-gen";

export interface ServerToClientEvents {
  message: (message: WSServerToClientMessage) => void;
}
