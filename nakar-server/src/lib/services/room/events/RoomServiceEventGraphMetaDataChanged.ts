import { MutableGraphMetaData } from '../graph/MutableGraphMetaData';

export interface RoomServiceEventGraphMetaDataChanged {
  type: 'RoomServiceEventGraphMetaDataChanged';
  roomId: string;
  metaData: MutableGraphMetaData;
}
