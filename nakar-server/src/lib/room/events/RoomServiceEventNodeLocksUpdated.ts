import type { SMap } from '../../tools/Map';

export interface RoomServiceEventNodeLocksUpdated {
  type: 'RoomServiceEventNodeLocksUpdated';
  roomId: string;
  locks: SMap<string, boolean>;
}
