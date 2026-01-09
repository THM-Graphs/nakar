import { ActionWsdto } from './dto/ActionWsdto';

export interface ClientToServerEvents {
  message(message: ActionWsdto): void;
}
