import { SchemaWsServerToClientMessage } from '../../../src-gen/schema';

export interface ServerToClientEvents {
  message: (message: SchemaWsServerToClientMessage) => void;
}
