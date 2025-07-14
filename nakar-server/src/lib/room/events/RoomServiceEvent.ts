import { RoomServiceEventNodeLocksUpdated } from './RoomServiceEventNodeLocksUpdated';
import { RoomServiceEventRoomPerformanceChanged } from './RoomServiceEventRoomPerformanceChanged';
import { RoomServiceEventRoomPhysicsUpdated } from './RoomServiceEventRoomPhysicsUpdated';
import { RoomServiceEventGraphMetaDataChanged } from './RoomServiceEventGraphMetaDataChanged';
import { RoomServiceEventProgressChanged } from './RoomServiceEventProgressChanged';
import { RoomServiceEventProgressCleared } from './RoomServiceEventProgressCleared';
import { RoomServiceEventRoomLocked } from './RoomServiceEventRoomLocked';
import { RoomServiceEventRoomUnlocked } from './RoomServiceEventRoomUnlocked';
import { RoomServiceEventGraphElementsChanged } from './RoomServiceEventGraphElementsChanged';
import { RoomServiceEventGraphTableChanged } from './RoomServiceEventGraphTableChanged';
import { RoomServiceEventKick } from './RoomServiceEventKick';
import { RoomServiceEventPresentExpandNodePreview } from './RoomServiceEventPresentExpandNodePreview';

export type RoomServiceEvent =
  | RoomServiceEventGraphMetaDataChanged
  | RoomServiceEventGraphTableChanged
  | RoomServiceEventGraphElementsChanged
  | RoomServiceEventRoomPerformanceChanged
  | RoomServiceEventRoomPhysicsUpdated
  | RoomServiceEventNodeLocksUpdated
  | RoomServiceEventProgressChanged
  | RoomServiceEventProgressCleared
  | RoomServiceEventRoomLocked
  | RoomServiceEventRoomUnlocked
  | RoomServiceEventKick
  | RoomServiceEventPresentExpandNodePreview;
