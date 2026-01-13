import { EventWsdto } from './dto/EventWsdto';

export interface ServerToClientEvents {
  message(message: EventWsdto): void;
}
