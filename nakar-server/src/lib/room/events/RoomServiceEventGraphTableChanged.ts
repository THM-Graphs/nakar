import { SMap } from '../../tools/Map';

export interface RoomServiceEventGraphTableChanged {
  type: 'RoomServiceEventGraphTableChanged';
  roomId: string;
  table: SMap<string, unknown>[];
}
