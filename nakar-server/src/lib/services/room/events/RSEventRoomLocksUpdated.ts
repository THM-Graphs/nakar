import { SMap } from '../../../tools/Map';

export interface RSEventRoomLocksUpdated {
  roomId: string;
  locks: SMap<string, boolean>;
}
