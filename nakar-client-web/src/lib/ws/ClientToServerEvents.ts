import { WSClientToServerMessage } from "../../../src-gen";

export interface ClientToServerEvents {
  message: (message: WSClientToServerMessage) => void;
}
