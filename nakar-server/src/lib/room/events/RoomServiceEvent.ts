import type { RoomServiceEventNodeLocksUpdated } from './RoomServiceEventNodeLocksUpdated';
import type { RoomServiceEventRoomPhysicsUpdated } from './RoomServiceEventRoomPhysicsUpdated';
import type { RoomServiceEventGraphMetaDataChanged } from './RoomServiceEventGraphMetaDataChanged';
import type { RoomServiceEventProgressChanged } from './RoomServiceEventProgressChanged';
import type { RoomServiceEventProgressCleared } from './RoomServiceEventProgressCleared';
import type { RoomServiceEventRoomLocked } from './RoomServiceEventRoomLocked';
import type { RoomServiceEventRoomUnlocked } from './RoomServiceEventRoomUnlocked';
import type { RoomServiceEventGraphElementsChanged } from './RoomServiceEventGraphElementsChanged';
import type { RoomServiceEventGraphTableChanged } from './RoomServiceEventGraphTableChanged';
import type { RoomServiceEventKick } from './RoomServiceEventKick';
import type { RoomServiceEventNotAllNodesLoaded } from './RoomServiceEventNotAllNodesLoaded';

export type RoomServiceEvent =
  | RoomServiceEventGraphMetaDataChanged
  | RoomServiceEventGraphTableChanged
  | RoomServiceEventGraphElementsChanged
  | RoomServiceEventRoomPhysicsUpdated
  | RoomServiceEventNodeLocksUpdated
  | RoomServiceEventProgressChanged
  | RoomServiceEventProgressCleared
  | RoomServiceEventRoomLocked
  | RoomServiceEventRoomUnlocked
  | RoomServiceEventKick
  | RoomServiceEventNotAllNodesLoaded;
