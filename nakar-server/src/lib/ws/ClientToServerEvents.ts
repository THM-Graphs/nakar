import { SchemaWsClientToServerMessage } from '../../../src-gen/schema';

export interface ClientToServerEvents {
  message: (message: SchemaWsClientToServerMessage) => void;
}
